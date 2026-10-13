import { Router } from 'express';
import { DriversController } from '../controllers/driversController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/nearby', asyncHandler(DriversController.getNearby));

export default router;
