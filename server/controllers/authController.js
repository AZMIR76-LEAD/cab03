// FG DRIVO Authentication Controller
import { db } from '../db.js';
import { appConfig } from '../config/appConfig.js';
import { ApiError } from '../middleware/errorHandler.js';

// In-memory verification cache with TTL
const otpStore = new Map();

export class AuthController {
  static sendOtp(req, res) {
    const { phone } = req.body;
    const code = appConfig.auth.demoOtp;
    const expiresAt = Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000;

    otpStore.set(phone, { code, expiresAt });

    const maskedPhone = phone.replace(/(\d{2})\d{4}(\d{4})/, '$1••••$2');

    return res.json({
      success: true,
      message: 'Verification OTP sent successfully via SMS.',
      demoCode: code,
      maskedPhone,
      expiresInSeconds: appConfig.auth.otpExpiryMinutes * 60,
    });
  }

  static verifyOtp(req, res) {
    const { phone, otp } = req.body;
    const cached = otpStore.get(phone);

    const isValid = otp === appConfig.auth.demoOtp || (cached && cached.code === otp && cached.expiresAt > Date.now());

    if (!isValid) {
      throw new ApiError('Invalid or expired verification OTP. Please try again.', 400);
    }

    // Clear used OTP
    otpStore.delete(phone);

    const user = db.get('user');
    const token = `${appConfig.auth.tokenPrefix}${Buffer.from(`${phone}_${Date.now()}`).toString('base64')}`;

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user,
    });
  }
}
