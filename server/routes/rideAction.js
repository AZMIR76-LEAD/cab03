// FG DRIVO — Driver Single Ride Action Routes (/api/ride)
import { Router } from 'express';
import { db } from '../db.js';
import { RIDE_STATUSES } from '../config/constants.js';
import { emitRideEvent, emitDriverTelemetry } from '../services/socketService.js';
import { RideSimulationService } from '../services/rideSimulationService.js';

const router = Router();

// Accept offer
router.post('/:rideId/accept', (req, res) => {
  const { rideId } = req.params;
  const { ph, name, vehicleType, vehicleNumber, rating, coords, fare, driverId } = req.body;

  RideSimulationService.stopSimulation();
  const activeRide = db.getActiveRide(rideId);
  if (activeRide) {
    // If already assigned to a driver, return existing state
    if (activeRide.driver && activeRide.status !== RIDE_STATUSES.FINDING_DRIVER && activeRide.status !== 'offered') {
      return res.json({ ok: 1, success: true, status: activeRide.status, rideId, ride: activeRide, alreadyAssigned: true });
    }

    activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
    const cleanPhone = (ph || '').replace(/\D/g, '').slice(-10) || '9876543210';
    const realDriver = {
      id: driverId || `DRV-${cleanPhone.slice(-4)}`,
      name: name || 'Driver Partner',
      phone: ph ? (ph.startsWith('+91') ? ph : `+91 ${ph}`) : `+91 ${cleanPhone}`,
      rating: Number(rating) || 4.8,
      tripsCount: 150,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      vehicle: {
        model: vehicleType || 'SUV',
        category: (vehicleType || 'suv').toLowerCase(),
        licensePlate: vehicleNumber || 'TN 57',
      },
    };
    activeRide.driver = realDriver;
    if (fare) activeRide.fare = Number(fare);
    if (coords && coords.lat) {
      activeRide.telematics = {
        ...activeRide.telematics,
        driverCoords: coords,
        lastUpdated: new Date().toISOString(),
      };
    }
    db.saveActiveRide(activeRide);

    console.log(`\x1b[32m[RideAction]\x1b[0m Driver ${realDriver.name} accepted ride ${activeRide.id} (Fare: ₹${activeRide.fare})`);

    // Emit real driver bid to the passenger finding screen (Targeted room)
    emitRideEvent(activeRide.id, 'ride:driver_bid', {
      rideId: activeRide.id,
      driverId: realDriver.id,
      driverName: realDriver.name,
      rating: realDriver.rating,
      vehicle: `${realDriver.vehicle.model} (${realDriver.vehicle.licensePlate})`,
      eta: '2 min away',
      fare: activeRide.fare,
      type: 'accepted',
      driver: realDriver,
    });

    emitRideEvent(activeRide.id, 'ride:status_changed', {
      rideId: activeRide.id,
      status: activeRide.status,
      telematics: activeRide.telematics,
      ride: activeRide,
    });
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
    emitDriverTelemetry(activeRide.id, activeRide.telematics);
  }

  res.json({ ok: 1, success: true, status: 'accepted', rideId, ride: activeRide });
});

// Decline offer
router.post('/:rideId/decline', (req, res) => {
  const { rideId } = req.params;
  const cleanPhone = (req.body.ph || '').replace(/\D/g, '').slice(-10);
  const driverId = req.body.driverId || (cleanPhone ? `DRV-${cleanPhone.slice(-4)}` : '');
  const ride = db.getActiveRide(rideId);
  if (ride) {
    if (!ride.declinedBy) ride.declinedBy = [];
    if (cleanPhone && !ride.declinedBy.includes(cleanPhone)) {
      ride.declinedBy.push(cleanPhone);
    }
    if (driverId && !ride.declinedBy.includes(driverId)) {
      ride.declinedBy.push(driverId);
    }
    if (!cleanPhone && !driverId && !ride.declinedBy.includes('default_driver')) {
      ride.declinedBy.push('default_driver');
    }
    db.saveActiveRide(ride);
    console.log(`\x1b[33m[RideAction]\x1b[0m Driver ${cleanPhone || driverId || 'default'} declined ride ${rideId}`);
  }
  res.json({ ok: 1, success: true, status: 'declined', rideId });
});

// Arrived at pickup
router.post('/:rideId/arrived', (req, res) => {
  const { rideId } = req.params;
  const activeRide = db.getActiveRide(rideId);
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
    activeRide.arrivedAt = new Date().toISOString();
    db.saveActiveRide(activeRide);
    emitRideEvent(activeRide.id, 'ride:status_changed', {
      rideId: activeRide.id,
      status: activeRide.status,
      telematics: activeRide.telematics,
      ride: activeRide,
    });
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
  }
  res.json({ ok: 1, success: true, status: 'arrived', rideId });
});

// Start trip with passenger OTP
router.post('/:rideId/start', (req, res) => {
  const { rideId } = req.params;
  const { otp } = req.body;
  const activeRide = db.getActiveRide(rideId);
  const expectedOtp = activeRide?.otp || '4819';

  if (otp && (otp === expectedOtp || (!activeRide && otp.length === 4))) {
    if (activeRide) {
      activeRide.status = RIDE_STATUSES.TRIP_IN_PROGRESS;
      activeRide.startedAt = new Date().toISOString();
      db.saveActiveRide(activeRide);
      emitRideEvent(activeRide.id, 'ride:status_changed', {
        rideId: activeRide.id,
        status: activeRide.status,
        telematics: activeRide.telematics,
        ride: activeRide,
      });
      emitRideEvent(activeRide.id, 'ride:updated', activeRide);
    }
    return res.json({ ok: 1, success: true, status: 'in_progress', rideId });
  }

  res.status(400).json({ ok: 0, error: 'Incorrect passenger OTP' });
});

// Complete trip
router.post('/:rideId/complete', (req, res) => {
  const { rideId } = req.params;
  const activeRide = db.getActiveRide(rideId);
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.completedAt = new Date().toISOString();
    db.saveActiveRide(activeRide);
    emitRideEvent(activeRide.id, 'ride:status_changed', {
      rideId: activeRide.id,
      status: activeRide.status,
      telematics: activeRide.telematics,
      ride: activeRide,
    });
    emitRideEvent(activeRide.id, 'ride:completed', activeRide);
  }
  res.json({ ok: 1, success: true, status: 'completed', rideId });
});

// Pay / Settle trip
router.post('/:rideId/pay', (req, res) => {
  const { rideId } = req.params;
  const { method, amount } = req.body;
  const activeRide = db.getActiveRide(rideId);
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.paymentStatus = 'Paid';
    activeRide.paymentMethod = method || 'cash';
    activeRide.fare = Number(amount) || activeRide.fare;
    db.saveActiveRide(activeRide);
    emitRideEvent(activeRide.id, 'ride:status_changed', {
      rideId: activeRide.id,
      status: activeRide.status,
      telematics: activeRide.telematics,
      ride: activeRide,
    });
    emitRideEvent(activeRide.id, 'ride:completed', activeRide);
  }
  res.json({ ok: 1, success: true, method, amount, rideId });
});

// Call customer relay
router.post('/:rideId/call', (req, res) => {
  const { rideId } = req.params;
  const activeRide = db.getActiveRide(rideId);
  const riderPhone = activeRide?.riderPhone || '+91 98765 11223';
  res.json({ ok: 1, success: true, customerPhone: riderPhone, maskedNumber: '+91 451 240 9988' });
});

export default router;
