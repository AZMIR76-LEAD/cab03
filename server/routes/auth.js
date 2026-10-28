import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateSendOtp, validateVerifyOtp } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/check-phone', asyncHandler(AuthController.checkPhone));
router.post('/check-email', asyncHandler(AuthController.checkEmail));
router.post('/social-login', asyncHandler(AuthController.socialLogin));
router.post('/send-otp', validateSendOtp, asyncHandler(AuthController.sendOtp));
router.post('/verify-otp', validateVerifyOtp, asyncHandler(AuthController.verifyOtp));

export default router;

