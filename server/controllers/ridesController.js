// FG DRIVO Core Rides & Dispatch Controller
import { db } from '../db.js';
import { VEHICLE_PRICING, RIDE_STATUSES } from '../config/constants.js';
import { calculateFare, getAllFareEstimates } from '../services/pricingService.js';
import { RideSimulationService } from '../services/rideSimulationService.js';
import { DispatchAlgorithmService } from '../services/dispatchAlgorithmService.js';
import { broadcastRideOffer, emitRideEvent } from '../services/socketService.js';
import { ApiError } from '../middleware/errorHandler.js';

export class RidesController {
  static getFareEstimates(req, res) {
    const distanceKm = parseFloat(req.query.distanceKm || '7.8');
    const durationMin = parseInt(req.query.durationMin || '22', 10);
    const pickup = req.query.pickup || 'Dindigul Railway Junction (Main Entrance)';
    const destination = req.query.destination || 'Palani Road Bypass, Near Velu Vidyalaya';

    const estimates = getAllFareEstimates(distanceKm, durationMin);

    return res.json({
      distanceKm,
      durationMin,
      pickup,
      destination,
      estimates,
    });
  }

  static async bookRide(req, res) {
    const {
      category = 'sedan',
      pickup = '',
      destination = '',
      fare,
      paymentMethod = 'Cash',
      pickupCoords = { lat: 10.3673, lng: 77.9803 },
      destinationCoords = { lat: 10.2833, lng: 77.9167 },
      riderName,
      riderPhone,
    } = req.body;

    const currentUser = (await db.getUserFromReq(req)) || db.get('user');
    const finalRiderName = riderName || currentUser?.name || 'Passenger';
    const finalRiderPhone = riderPhone || currentUser?.phone || '+91 98765 11223';
    const userId = currentUser ? currentUser.id : null;

    const pricing = VEHICLE_PRICING[category] || VEHICLE_PRICING.sedan;
    const distanceKm = 7.8;
    const durationMin = 22;
    const fareDetails = calculateFare(category, distanceKm, durationMin);
    const totalFare = fare ? Number(fare) : fareDetails.total;

    const rideId = 'RX-' + Math.floor(10000 + Math.random() * 90000);

    const normalizeCat = (cat) => {
      if (!cat) return '';
      const c = String(cat).toLowerCase();
      if (c.includes('suv')) return 'suv';
      if (c.includes('mini')) return 'mini';
      if (c.includes('premium')) return 'premium';
      if (c.includes('sedan')) return 'sedan';
      return c.trim();
    };

    const targetCategory = normalizeCat(category);

    const newRide = {
      id: rideId,
      userId,
      createdAt: new Date().toISOString(),
      status: RIDE_STATUSES.FINDING_DRIVER,
      category: pricing.name,
      vehicleType: targetCategory,
      pickup: pickup || 'Pickup Point',
      destination: destination || 'Destination Point',
      pickupCoords,
      destinationCoords,
      distanceKm,
      durationMin,
      fare: totalFare,
      fareBreakdown: fareDetails.breakdown,
      paymentMethod,
      paymentStatus: 'Pending',
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      riderName: finalRiderName,
      riderPhone: finalRiderPhone,
      declinedBy: [],
      driver: null, // NO DEFAULT DRIVER - Waiting for real driver in Driver App
      telematics: {
        etaMinutes: 3,
        distanceToPickupKm: 1.2,
        driverCoords: null,
        heading: 90,
        lastUpdated: new Date().toISOString(),
      },
    };

    db.saveActiveRide(newRide);

    const drivers = db.get('drivers') || [];
    const onlineDrivers = drivers.filter((d) => {
      if (!d.isOnline) return false;
      const driverCat = normalizeCat(d.vehicle?.category || d.vehicle?.model || d.vehicleType);
      return !driverCat || driverCat === targetCategory;
    });
    const hasOnlineDrivers = onlineDrivers.length > 0;

    // Broadcast ride offer to real connected driver partners matching this vehicle category
    broadcastRideOffer({
      offerId: 'OFFER-' + Math.floor(1000 + Math.random() * 9000),
      tripId: rideId,
      rideId,
      category: targetCategory,
      vehicleType: targetCategory,
      categoryName: pricing.name,
      pickupArea: newRide.pickup,
      pickupDistanceKm: 1.2,
      pickupEtaMins: 3,
      destinationArea: newRide.destination,
      estimatedEarnings: Math.round(totalFare * 0.88),
      fare: totalFare,
      distanceKm,
      pickupCoords,
      destinationCoords,
      riderName: newRide.riderName,
      riderPhone: newRide.riderPhone,
      timeoutSeconds: 30,
    });

    console.log(`\x1b[32m[Dispatch]\x1b[0m New ride ${rideId} (${targetCategory}) broadcasted to driver pool: ${newRide.pickup} -> ${newRide.destination} (₹${totalFare}) [Matching Online: ${onlineDrivers.length}]`);

    if (!hasOnlineDrivers) {
      console.log(`\x1b[33m[Dispatch]\x1b[0m 0 drivers currently online for ${targetCategory} ride ${rideId}`);
      setTimeout(() => {
        emitRideEvent(rideId, 'ride:no_drivers_available', {
          rideId,
          category: targetCategory,
          message: "Drivers couldn't be reached at this moment",
        });
      }, 3000);
    }

    return res.status(201).json({
      success: true,
      message: 'Ride request dispatched. Waiting for active driver partner.',
      ride: newRide,
      hasOnlineDrivers,
      onlineDriversCount: onlineDrivers.length,
    });
  }

  static async getActiveRide(req, res) {
    const { rideId } = req.query;
    let activeRide = null;
    if (rideId) {
      activeRide = db.getActiveRide(rideId);
    } else {
      const currentUser = await db.getUserFromReq(req);
      if (currentUser && currentUser.id) {
        const allRides = db.getAllActiveRides();
        activeRide = allRides.find((r) => r.userId === currentUser.id && r.status !== 'Completed' && r.status !== 'cancelled') || null;
      }
      if (!activeRide) {
        activeRide = db.getActiveRide();
      }
    }
    return res.json({
      active: !!activeRide,
      ride: activeRide,
    });
  }

  static advanceSimulation(req, res) {
    const updatedRide = RideSimulationService.advanceManual();
    if (!updatedRide) {
      throw new ApiError('No active ride found to advance.', 404);
    }
    return res.json({
      success: true,
      message: `Ride simulation advanced to status: ${updatedRide.status}`,
      ride: updatedRide,
    });
  }

  static cancelRide(req, res) {
    const { rideId } = req.body || req.query || {};
    if (rideId) {
      const ride = db.getActiveRide(rideId);
      if (ride) {
        ride.status = 'cancelled';
        emitRideEvent(rideId, 'ride:cancelled', { rideId, id: rideId, message: 'Ride cancelled' });
      }
      db.removeActiveRide(rideId);
    } else {
      RideSimulationService.cancel();
      const current = db.getActiveRide();
      if (current && current.id) {
        emitRideEvent(current.id, 'ride:cancelled', { rideId: current.id, id: current.id, message: 'Ride cancelled' });
        db.removeActiveRide(current.id);
      }
    }
    return res.json({
      success: true,
      message: 'Active ride request cancelled successfully.',
    });
  }

  static rateRide(req, res) {
    const { id } = req.params;
    const { stars = 5, feedbackTags = [], comment = '' } = req.body;
    const activeRide = db.getActiveRide(id);

    if (activeRide && activeRide.id === id) {
      activeRide.ratingGiven = stars;
      activeRide.feedbackTags = feedbackTags;
      activeRide.comment = comment;
      activeRide.status = 'Completed';

      // Record real customer review in driver feedback directory
      if (activeRide.driver) {
        const cleanPhone = (activeRide.driver.phone || '').replace(/\D/g, '').slice(-10);
        const feedbacks = db.get('driverFeedback') || {};
        if (!feedbacks[cleanPhone]) feedbacks[cleanPhone] = [];
        feedbacks[cleanPhone].unshift({
          n: activeRide.riderName || 'Customer',
          s: Number(stars) || 5,
          c: comment || (feedbackTags.length > 0 ? feedbackTags.join(', ') : 'Smooth and safe ride.'),
          w: 'Today',
          a: activeRide.pickup || 'Pickup',
          b: activeRide.destination || 'Destination',
        });
        db.set('driverFeedback', feedbacks);
      }

      // Insert into ride history
      db.update('rides', (list) => [
        {
          id: activeRide.id,
          userId: activeRide.userId,
          date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Completed',
          category: activeRide.category,
          pickup: activeRide.pickup,
          destination: activeRide.destination,
          fare: activeRide.fare,
          distance: activeRide.distanceKm + ' km',
          duration: activeRide.durationMin + ' mins',
          driver: activeRide.driver ? activeRide.driver.name : 'Vikram Rathore',
          vehicle: activeRide.driver && activeRide.driver.vehicle ? activeRide.driver.vehicle.model : 'FG DRIVO Fleet',
          ratingGiven: stars,
          paymentMethod: activeRide.paymentMethod,
        },
        ...list,
      ]);

      db.removeActiveRide(id);
    } else {
      // Find in existing history if already concluded
      db.update('rides', (list) =>
        list.map((r) => (r.id === id ? { ...r, ratingGiven: stars, comment } : r))
      );
    }

    return res.json({
      success: true,
      message: 'Trip rating and passenger feedback recorded.',
    });
  }

  static async getRideHistory(req, res) {
    const { status } = req.query;
    const currentUser = (await db.getUserFromReq(req)) || db.get('user');
    const userId = currentUser ? currentUser.id : null;

    if (db.isPostgresConnected && db.pgPool && userId) {
      try {
        let sql = 'SELECT * FROM rides WHERE user_id = $1';
        const params = [userId];
        if (status) {
          sql += ' AND LOWER(status) = LOWER($2)';
          params.push(status);
        }
        sql += ' ORDER BY created_at DESC';
        const result = await db.pgPool.query(sql, params);
        const rides = result.rows.map(row => ({
          id: row.id,
          date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          status: row.status,
          category: row.category || 'FG DRIVO Sedan',
          pickup: row.pickup_name,
          pickupCoords: row.pickup_coords,
          destination: row.drop_name,
          destinationCoords: row.drop_coords,
          fare: parseFloat(row.fare),
          distance: row.distance || '0 km',
          duration: row.duration || '0 mins',
          driver: row.driver_name,
          vehicle: row.vehicle_info,
          ratingGiven: row.rating_given,
          paymentMethod: row.payment_method,
        }));
        return res.json({ rides });
      } catch (err) {
        console.warn('PostgreSQL ride history query error:', err.message);
      }
    }

    const allRides = db.get('rides') || [];
    let userRides = userId ? allRides.filter((r) => r.userId === userId) : [];
    if (status) {
      userRides = userRides.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({ rides: userRides });
  }

  static getReceipt(req, res) {
    const { id } = req.params;
    const rides = db.get('rides');
    const ride = rides.find((r) => r.id === id) || rides[0];

    if (!ride) {
      throw new ApiError('Trip receipt not found for ID: ' + id, 404);
    }

    return res.json({
      rideId: ride.id,
      invoiceNo: 'INV-' + ride.id.replace('RX-', '2026-'),
      date: ride.date,
      pickup: ride.pickup,
      destination: ride.destination,
      distance: ride.distance,
      duration: ride.duration,
      driver: ride.driver,
      vehicle: ride.vehicle,
      breakdown: {
        baseFare: 69.0,
        distanceFare: 117.0,
        timeFare: 44.0,
        platformFee: 15.0,
        taxes: 18.0,
        discount: 20.0,
        total: ride.fare,
      },
      paymentMethod: ride.paymentMethod,
      issuedAt: new Date().toISOString(),
    });
  }

  static getAlgorithmDiagnostics(req, res) {
    const drivers = db.get('drivers') || [];
    const pickupCoords = { lat: 10.3644, lng: 77.9702 };
    const surge = DispatchAlgorithmService.calculateDynamicSurge(14, drivers.length);
    const optimalMatch = DispatchAlgorithmService.findOptimalCaptain(pickupCoords, 'sedan', drivers);

    return res.json({
      success: true,
      algorithms: {
        distanceEngine: 'Great-Circle Haversine Geodesic Distance Matrix',
        dispatchMatcher: 'Multi-Factor Bipartite Proximity & Rating Matching',
        surgePricing: 'Logistic Sigmoid Supply-Demand Equilibrium Curve',
        trajectorySmoothing: 'Catmull-Rom Cubic Spline GPS Interpolation',
      },
      currentSurge: surge,
      pickupReference: { name: 'Dindigul Railway Junction', coords: pickupCoords },
      optimalDispatchTest: optimalMatch,
      activeCaptainsCount: drivers.length,
      timestamp: new Date().toISOString(),
    });
  }
}
