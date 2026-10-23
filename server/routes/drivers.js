// FG DRIVO Captains & Fleet Telemetry Routes
import { Router } from 'express';
import { DriversController } from '../controllers/driversController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 1. Public Nearby Fleet (Passenger Map)
router.get('/nearby', asyncHandler(DriversController.getNearby));

// 2. Captain Profile & Authentication
router.post('/auth', asyncHandler(DriversController.authDriver));

// 3. Online/Offline Duty & Telematics
router.post('/toggle-online', asyncHandler(DriversController.toggleOnline));
router.post('/location', asyncHandler(DriversController.updateLocation));

// 4. Trip Lifecycle Management
router.get('/active-trip', asyncHandler(DriversController.getActiveTrip));
router.post('/trip/accept', asyncHandler(DriversController.acceptTrip));
router.post('/trip/reject', asyncHandler(DriversController.rejectTrip));
router.post('/trip/arrived', asyncHandler(DriversController.arrivedAtPickup));
router.post('/trip/start', asyncHandler(DriversController.startTripWithOtp));
router.post('/trip/complete', asyncHandler(DriversController.completeTrip));

export default router;
