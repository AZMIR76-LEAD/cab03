// FG DRIVO Captains & Fleet Telemetry Controller
import { db } from '../db.js';
import { CITY_INFO, RIDE_STATUSES } from '../config/constants.js';
import { ApiError } from '../middleware/errorHandler.js';
import { emitRideEvent, emitDriverTelemetry } from '../services/socketService.js';
import { RideSimulationService } from '../services/rideSimulationService.js';

export class DriversController {
  // 1. Fetch nearby drivers for customer map
  static getNearby(req, res) {
    const drivers = db.get('drivers') || [];

    // Filter online drivers or include city baseline drivers
    const activeDrivers = drivers.filter((d) => d.isOnline !== false);
    const pool = activeDrivers.length > 0 ? activeDrivers : drivers;

    // Micro-movements jitter for natural visual appeal
    const jittered = pool.map((driver) => {
      const deltaX = Math.random() * 0.4 - 0.2;
      const deltaY = Math.random() * 0.4 - 0.2;
      const curX = driver.coords?.x || 50;
      const curY = driver.coords?.y || 50;
      const newX = Math.min(Math.max(curX + deltaX, CITY_INFO.bounds.minX), CITY_INFO.bounds.maxX);
      const newY = Math.min(Math.max(curY + deltaY, CITY_INFO.bounds.minY), CITY_INFO.bounds.maxY);

      return {
        ...driver,
        coords: {
          x: parseFloat(newX.toFixed(2)),
          y: parseFloat(newY.toFixed(2)),
        },
      };
    });

    return res.json({
      success: true,
      city: CITY_INFO.name,
      state: CITY_INFO.state,
      rtoCode: CITY_INFO.rtoCode,
      activeCabs: Math.max(jittered.length, 12),
      count: jittered.length,
      drivers: jittered,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Captain Login & Profile Setup
  static authDriver(req, res) {
    const { phone, name, vehicleModel, licensePlate, vehicleCategory } = req.body;
    const cleanPhone = (phone || '').trim();

    const drivers = db.get('drivers') || [];
    let driver = drivers.find((d) => d.phone === cleanPhone || (cleanPhone && d.phone?.includes(cleanPhone.slice(-10))));

    if (!driver) {
      const newId = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
      driver = {
        id: newId,
        name: name || 'FG DRIVO Captain',
        phone: cleanPhone || '+91 98112 34567',
        rating: 4.95,
        tripsCount: 0,
        earningsToday: 0.0,
        isOnline: true,
        status: 'available',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        vehicle: {
          model: vehicleModel || 'Honda City • Sedan',
          category: vehicleCategory || 'sedan',
          licensePlate: licensePlate || 'TN 57 CE 4819',
          color: 'White',
        },
        coords: { x: 48, y: 62 },
        heading: 135,
      };
      drivers.push(driver);
      db.set('drivers', drivers);
    } else {
      if (name) driver.name = name;
      if (vehicleModel) driver.vehicle.model = vehicleModel;
      if (licensePlate) driver.vehicle.licensePlate = licensePlate;
      driver.isOnline = true;
      driver.status = 'available';
    }

    return res.json({
      success: true,
      message: 'Captain authenticated successfully.',
      driver,
    });
  }

  // 3. Toggle Online / Offline Duty
  static toggleOnline(req, res) {
    const { driverId, isOnline, coords } = req.body;
    const drivers = db.get('drivers') || [];
    const driver = drivers.find((d) => d.id === driverId) || drivers[0];

    if (!driver) {
      throw new ApiError('Driver not found.', 404);
    }

    driver.isOnline = !!isOnline;
    driver.status = isOnline ? 'available' : 'offline';
    if (coords) driver.coords = coords;

    db.set('drivers', drivers);

    return res.json({
      success: true,
      isOnline: driver.isOnline,
      status: driver.status,
      driver,
    });
  }

  // 4. Update GPS Location & Telematics
  static updateLocation(req, res) {
    const { driverId, lat, lng, coords, heading, speed } = req.body;
    const drivers = db.get('drivers') || [];
    const driver = drivers.find((d) => d.id === driverId) || drivers[0];

    if (driver) {
      if (coords) driver.coords = coords;
      else if (lat !== undefined && lng !== undefined) {
        driver.coords = { x: lng, y: lat };
      }
      if (heading !== undefined) driver.heading = heading;
      driver.lastPing = new Date().toISOString();
    }

    // Stream to active ride if assigned
    const activeRide = db.get('activeRide');
    if (activeRide && activeRide.driver?.id === driver?.id) {
      activeRide.telematics = {
        ...activeRide.telematics,
        driverCoords: driver.coords,
        heading: driver.heading || 0,
        lastUpdated: new Date().toISOString(),
      };
      emitDriverTelemetry(activeRide.id, activeRide.telematics);
    }

    return res.json({ success: true, coords: driver?.coords });
  }

  // 5. Captain Accepts Incoming Trip (Stops Bot Simulation)
  static acceptTrip(req, res) {
    const { driverId, rideId } = req.body;
    const activeRide = db.get('activeRide');

    if (!activeRide) {
      throw new ApiError('No active ride found to accept.', 404);
    }
    if (activeRide.id !== rideId && rideId) {
      throw new ApiError('Trip ID does not match current dispatch request.', 400);
    }

    // Stop automated bot simulation
    RideSimulationService.stopSimulation();

    const drivers = db.get('drivers') || [];
    const driver = drivers.find((d) => d.id === driverId) || drivers[0];

    activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
    activeRide.driver = {
      ...driver,
      isRealCaptain: true,
    };
    activeRide.telematics = {
      ...activeRide.telematics,
      driverCoords: driver.coords || { x: 48, y: 62 },
      heading: driver.heading || 135,
      etaMinutes: 3,
      distanceToPickupKm: 1.2,
      lastUpdated: new Date().toISOString(),
    };

    db.set('activeRide', activeRide);

    // Notify customer in real time
    emitRideEvent(activeRide.id, 'ride:status_update', {
      status: RIDE_STATUSES.DRIVER_ASSIGNED,
      ride: activeRide,
      driver: activeRide.driver,
      message: `Captain ${driver.name} has accepted your ride!`,
    });

    return res.json({
      success: true,
      message: 'Trip accepted successfully.',
      ride: activeRide,
    });
  }

  // 6. Captain Rejects Trip
  static rejectTrip(req, res) {
    const { driverId, rideId } = req.body;
    console.log(`[Dispatch] Captain ${driverId} declined trip ${rideId}`);
    return res.json({ success: true, message: 'Trip declined.' });
  }

  // 7. Captain Arrived at Pickup Point
  static arrivedAtPickup(req, res) {
    const { driverId, rideId } = req.body;
    const activeRide = db.get('activeRide');

    if (!activeRide) {
      throw new ApiError('No active ride found.', 404);
    }

    activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
    activeRide.telematics = {
      ...activeRide.telematics,
      etaMinutes: 0,
      distanceToPickupKm: 0.0,
      lastUpdated: new Date().toISOString(),
    };

    db.set('activeRide', activeRide);

    emitRideEvent(activeRide.id, 'ride:status_update', {
      status: RIDE_STATUSES.DRIVER_ARRIVED,
      ride: activeRide,
      message: 'Your captain has arrived at the pickup location!',
    });

    return res.json({
      success: true,
      message: 'Arrival notification dispatched to customer.',
      ride: activeRide,
    });
  }

  // 8. Verify OTP & Start Trip
  static startTripWithOtp(req, res) {
    const { driverId, rideId, otp } = req.body;
    const activeRide = db.get('activeRide');

    if (!activeRide) {
      throw new ApiError('No active ride found.', 404);
    }

    const cleanOtp = String(otp || '').trim();
    // Validate OTP (match ride.otp or test master OTP 4819 / 529481)
    if (cleanOtp !== String(activeRide.otp) && cleanOtp !== '4819' && cleanOtp !== '529481') {
      throw new ApiError('Incorrect Ride Start OTP! Please ask the customer for the 4-digit OTP shown on their screen.', 400);
    }

    activeRide.status = RIDE_STATUSES.TRIP_STARTED;
    activeRide.startedAt = new Date().toISOString();

    db.set('activeRide', activeRide);

    emitRideEvent(activeRide.id, 'ride:status_update', {
      status: RIDE_STATUSES.TRIP_STARTED,
      ride: activeRide,
      message: 'OTP verified! Trip started successfully.',
    });

    return res.json({
      success: true,
      message: 'OTP verified. Have a safe journey!',
      ride: activeRide,
    });
  }

  // 9. Complete Trip & Collect Payment
  static completeTrip(req, res) {
    const { driverId, rideId } = req.body;
    const activeRide = db.get('activeRide');

    if (!activeRide) {
      throw new ApiError('No active ride found.', 404);
    }

    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.completedAt = new Date().toISOString();

    // Update driver's daily earnings
    const drivers = db.get('drivers') || [];
    const driver = drivers.find((d) => d.id === (driverId || activeRide.driver?.id));
    if (driver) {
      driver.earningsToday = parseFloat(((driver.earningsToday || 0) + activeRide.fare).toFixed(2));
      driver.tripsCount = (driver.tripsCount || 0) + 1;
      driver.status = 'available';
    }

    // Save to historical rides
    const rides = db.get('rides') || [];
    rides.unshift({
      ...activeRide,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    });
    db.set('rides', rides);
    db.set('activeRide', null);

    emitRideEvent(activeRide.id, 'ride:status_update', {
      status: RIDE_STATUSES.COMPLETED,
      ride: activeRide,
      message: 'Trip completed successfully.',
    });

    return res.json({
      success: true,
      message: 'Trip completed. Please collect payment.',
      ride: activeRide,
      driverEarningsToday: driver?.earningsToday || activeRide.fare,
    });
  }

  // 10. Get Active Assigned Trip for Driver
  static getActiveTrip(req, res) {
    const activeRide = db.get('activeRide');
    return res.json({
      hasActiveTrip: !!activeRide,
      ride: activeRide || null,
    });
  }
}
