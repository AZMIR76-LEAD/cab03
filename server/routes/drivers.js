import { Router } from 'express';
import { DriversController } from '../controllers/driversController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../db.js';

const router = Router();

router.get('/nearby', asyncHandler(DriversController.getNearby));

router.get('/online-count', (req, res) => {
  const drivers = db.get('drivers') || [];
  const reqCat = (req.query.category || '').toLowerCase();

  const normalizeCat = (c) => {
    if (!c) return '';
    const s = String(c).toLowerCase();
    if (s.includes('suv')) return 'suv';
    if (s.includes('mini')) return 'mini';
    if (s.includes('premium')) return 'premium';
    if (s.includes('sedan')) return 'sedan';
    return s.trim();
  };

  const targetCat = normalizeCat(reqCat);
  const onlineDrivers = drivers.filter((d) => {
    if (!d.isOnline) return false;
    if (targetCat) {
      const dCat = normalizeCat(d.vehicle?.category || d.vehicle?.model || d.vehicleType);
      return !dCat || dCat === targetCat;
    }
    return true;
  });

  return res.json({
    success: true,
    count: onlineDrivers.length,
    hasOnline: onlineDrivers.length > 0,
    category: targetCat || 'all',
    drivers: onlineDrivers.map((d) => ({
      id: d.id,
      name: d.name,
      vehicle: d.vehicle,
      rating: d.rating,
    })),
  });
});

export default router;
