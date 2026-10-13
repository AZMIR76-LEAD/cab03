import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/profile', asyncHandler(UserController.getProfile));
router.put('/profile', asyncHandler(UserController.updateProfile));

export default router;
