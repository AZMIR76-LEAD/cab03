// FG DRIVO Core Rides & Dispatch Controller
import { db } from '../db.js';
import { VEHICLE_PRICING, RIDE_STATUSES } from '../config/constants.js';
import { calculateFare, getAllFareEstimates } from '../services/pricingService.js';
import { RideSimulationService } from '../services/rideSimulationService.js';
import { DispatchAlgorithmService } from '../services/dispatchAlgorithmService.js';
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

  static bookRide(req, res) {
    const {
      category = 'sedan',
      pickup = 'Dindigul Railway Junction (Main Entrance)',
      destination = 'Palani Road Bypass, Near Velu Vidyalaya',
      paymentMethod = 'UPI (Google Pay)',
      pickupCoords = { x: 38, y: 72, lat: 10.3644, lng: 77.9702 },
      destinationCoords = { x: 74, y: 32, lat: 10.3812, lng: 77.9480 },
    } = req.body;

    const pricing = VEHICLE_PRICING[category] || VEHICLE_PRICING.sedan;
    const distanceKm = 7.8;
    const durationMin = 22;
    const fareDetails = calculateFare(category, distanceKm, durationMin);

    const drivers = db.get('drivers');
    // Intelligent Multi-Factor Bipartite Captain Dispatch Algorithm
    const dispatchResult = DispatchAlgorithmService.findOptimalCaptain(pickupCoords, category, drivers);
    const assignedDriver = dispatchResult ? dispatchResult.selectedCaptain : (drivers.find((d) => d.vehicle.category === category) || drivers[0]);

    const rideId = 'RX-' + Math.floor(10000 + Math.random() * 90000);

    const newRide = {
      id: rideId,
      createdAt: new Date().toISOString(),
      status: RIDE_STATUSES.FINDING_DRIVER,
      category: pricing.name,
      pickup,
      destination,
      pickupCoords,
      destinationCoords,
      distanceKm,
      durationMin,
      fare: fareDetails.total,
      fareBreakdown: fareDetails.breakdown,
      paymentMethod,
      paymentStatus: 'Paid',
      otp: '4819',
      driver: assignedDriver,
      dispatchAlgorithm: {
        algorithm: 'Multi-Factor Bipartite Weighted Proximity Matching',
        metrics: dispatchResult ? dispatchResult.dispatchMetrics : null,
        candidateRankings: dispatchResult ? dispatchResult.candidateRankings : [],
      },
      telematics: {
        etaMinutes: dispatchResult && dispatchResult.dispatchMetrics ? dispatchResult.dispatchMetrics.etaMinutes : fareDetails.etaMinutes,
        distanceToPickupKm: dispatchResult && dispatchResult.dispatchMetrics ? dispatchResult.dispatchMetrics.distanceKm : 1.4,
        driverCoords: assignedDriver.coords || { x: 48, y: 62 },
        heading: assignedDriver.heading || 135,
        lastUpdated: new Date().toISOString(),
      },
    };

    db.set('activeRide', newRide);

    // Kick off autonomous background ride lifecycle simulation
    RideSimulationService.startSimulation(rideId);

    return res.status(201).json({
      success: true,
      message: 'Ride request dispatched. Locating nearest captain.',
      ride: newRide,
    });
  }

  static getActiveRide(req, res) {
    const activeRide = db.get('activeRide');
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
    RideSimulationService.cancel();
    return res.json({
      success: true,
      message: 'Active ride request cancelled successfully.',
    });
  }

  static rateRide(req, res) {
    const { id } = req.params;
    const { stars = 5, feedbackTags = [], comment = '' } = req.body;
    const activeRide = db.get('activeRide');

    if (activeRide && activeRide.id === id) {
      activeRide.ratingGiven = stars;
      activeRide.feedbackTags = feedbackTags;
      activeRide.comment = comment;
      activeRide.status = 'Completed';

      // Insert into ride history
      db.update('rides', (list) => [
        {
          id: activeRide.id,
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

      db.set('activeRide', null);
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
