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
  const { ph } = req.body;

  RideSimulationService.stopSimulation();
  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
    activeRide.driver = {
      id: `DRV-${(ph || '8821').slice(-4)}`,
      name: 'Murugan K',
      phone: ph || '+91 98765 43210',
      rating: 4.88,
      vehicle: {
        model: 'Honda City',
        category: 'sedan',
        licensePlate: 'TN 57 AZ 4821',
      },
    };
    db.save();
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
  }

  res.json({ ok: 1, success: true, status: 'accepted', rideId });
});

// Decline offer
router.post('/:rideId/decline', (req, res) => {
  res.json({ ok: 1, success: true, status: 'declined', rideId: req.params.rideId });
});

// Arrived at pickup
router.post('/:rideId/arrived', (req, res) => {
  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
    activeRide.arrivedAt = new Date().toISOString();
    db.save();
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
  }
  res.json({ ok: 1, success: true, status: 'arrived' });
});

// Start trip with passenger OTP
router.post('/:rideId/start', (req, res) => {
  const { otp } = req.body;
  const activeRide = db.get('activeRide');
  const expectedOtp = activeRide?.otp || '4819';

  if (otp && (otp === expectedOtp || otp.length === 4)) {
    if (activeRide) {
      activeRide.status = RIDE_STATUSES.TRIP_IN_PROGRESS;
      activeRide.startedAt = new Date().toISOString();
      db.save();
      emitRideEvent(activeRide.id, 'ride:updated', activeRide);
    }
    return res.json({ ok: 1, success: true, status: 'in_progress' });
  }

  res.status(400).json({ ok: 0, error: 'Incorrect passenger OTP' });
});

// Complete trip
router.post('/:rideId/complete', (req, res) => {
  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.completedAt = new Date().toISOString();
    db.save();
    emitRideEvent(activeRide.id, 'ride:completed', activeRide);
  }
  res.json({ ok: 1, success: true, status: 'completed' });
});

// Pay / Settle trip
router.post('/:rideId/pay', (req, res) => {
  const { method, amount } = req.body;
  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.paymentMethod = method || 'cash';
    activeRide.fare = Number(amount) || activeRide.fare;
    db.save();
    emitRideEvent(activeRide.id, 'ride:completed', activeRide);
  }
  res.json({ ok: 1, success: true, method, amount });
});

// Call customer relay
router.post('/:rideId/call', (req, res) => {
  const activeRide = db.get('activeRide');
  res.json({ ok: 1, success: true, tel: activeRide?.riderPhone || '+91 98765 43210' });
});

export default router;

