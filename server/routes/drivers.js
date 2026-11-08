import { Router } from 'express';
import { DriversController } from '../controllers/driversController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../db.js';

const router = Router();

router.get('/nearby', asyncHandler(DriversController.getNearby));

router.get('/online-count', (req, res) => {
  const drivers = db.get('drivers') || [];
  const onlineDrivers = drivers.filter((d) => d.isOnline);
  return res.json({
    success: true,
    count: onlineDrivers.length,
    hasOnline: onlineDrivers.length > 0,
    drivers: onlineDrivers.map((d) => ({
      id: d.id,
      name: d.name,
      vehicle: d.vehicle,
      rating: d.rating,
    })),
  });
});

export default router;
