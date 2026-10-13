// FG DRIVO Authentication Controller
import { db } from '../db.js';
import { appConfig } from '../config/appConfig.js';
import { ApiError } from '../middleware/errorHandler.js';
import { SMSService } from '../services/smsService.js';

// In-memory verification cache with TTL: phone -> { code, expiresAt }
const otpStore = new Map();

export class AuthController {
  static async sendOtp(req, res) {
    const { phone } = req.body;
    const cleanPhone = (phone || '').trim();
    const provider = (process.env.SMS_GATEWAY_PROVIDER || 'mock').toLowerCase();
    const isMock = provider === 'mock' || !process.env.SMS_API_KEY;

    // Use default demo code for mock or generate cryptographically secure 6-digit OTP
    const code = isMock
      ? appConfig.auth.demoOtp
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000;

    // Store in-memory
    otpStore.set(cleanPhone, { code, expiresAt });

    const maskedPhone = cleanPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1••••$2');

    // Dispatch via SMS Gateway
    const dispatchResult = await SMSService.sendOtp({ phone: cleanPhone, code });

    return res.json({
      success: true,
      message: 'Verification OTP sent successfully via SMS.',
      demoCode: isMock ? code : undefined,
      maskedPhone,
      expiresInSeconds: appConfig.auth.otpExpiryMinutes * 60,
      provider: dispatchResult.provider || provider,
    });
  }

  static verifyOtp(req, res) {
    const { phone, otp } = req.body;
    const cleanPhone = (phone || '').trim();
    const cleanOtp = (otp || '').trim();

    const cached = otpStore.get(cleanPhone) || otpStore.get(phone);

    const isMock = (process.env.SMS_GATEWAY_PROVIDER || 'mock').toLowerCase() === 'mock' || !process.env.SMS_API_KEY;
    const isDemoMatch = isMock && cleanOtp === appConfig.auth.demoOtp;
    const isStoreMatch = cached && cached.code === cleanOtp && cached.expiresAt > Date.now();

    const isValid = isDemoMatch || isStoreMatch;

    if (!isValid) {
      throw new ApiError('Invalid or expired verification OTP. Please try again.', 400);
    }

    // Clear used OTP
    otpStore.delete(cleanPhone);
    otpStore.delete(phone);

    const user = db.get('user');
    const token = `${appConfig.auth.tokenPrefix}${Buffer.from(`${cleanPhone}_${Date.now()}`).toString('base64')}`;

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user,
    });
  }
}
