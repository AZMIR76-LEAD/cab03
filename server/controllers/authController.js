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

    // Always generate a fresh, truly random 6-digit OTP code for every single phone number!
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const code = randomOtp;

    const expiresAt = Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000;

    // Store in-memory by formatted phone and 10-digit phone
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);
    otpStore.set(cleanPhone, { code, expiresAt });
    if (tenDigits) otpStore.set(tenDigits, { code, expiresAt });

    const maskedPhone = cleanPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1••••$2');

    // Dispatch via SMS Gateway
    const dispatchResult = await SMSService.sendOtp({ phone: cleanPhone, code });

    return res.json({
      success: true,
      message: dispatchResult.error
        ? `SMS Gateway: ${dispatchResult.error}`
        : 'Verification OTP sent successfully via SMS.',
      code: randomOtp,
      demoCode: randomOtp,
      maskedPhone,
      expiresInSeconds: appConfig.auth.otpExpiryMinutes * 60,
      provider: dispatchResult.provider || provider,
      deliveryStatus: dispatchResult.success === false ? 'failed' : 'sent',
      gatewayError: dispatchResult.error || null,
    });
  }

  static verifyOtp(req, res) {
    const { phone, otp } = req.body;
    const cleanPhone = (phone || '').trim();
    const cleanOtp = (otp || '').trim();
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);

    const cached = otpStore.get(cleanPhone) || otpStore.get(phone) || (tenDigits ? otpStore.get(tenDigits) : null);

    // Master testing code (529481) always valid for app testing and Google Play review
    const isDemoMatch = cleanOtp === appConfig.auth.demoOtp;
    const isStoreMatch = cached && cached.code === cleanOtp && cached.expiresAt > Date.now();

    const isValid = isDemoMatch || isStoreMatch;

    if (!isValid) {
      throw new ApiError('Invalid or expired verification OTP. Please try again.', 400);
    }

    // Clear used OTP
    otpStore.delete(cleanPhone);
    otpStore.delete(phone);
    if (tenDigits) otpStore.delete(tenDigits);

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
