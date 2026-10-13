import { Router } from 'express';
import { NotificationsController } from '../controllers/notificationsController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(NotificationsController.getNotifications));
router.post('/mark-read', asyncHandler(NotificationsController.markAllAsRead));

export default router;
