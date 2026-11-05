// FG DRIVO Authentication Controller
import crypto from 'crypto';
import { db } from '../db.js';
import { appConfig } from '../config/appConfig.js';
import { ApiError } from '../middleware/errorHandler.js';
import { SMSService } from '../services/smsService.js';

// In-memory verification cache with TTL: phone -> { code, expiresAt, attempts, lastSentAt }
const otpStore = new Map();

function generateSignedToken(userId, phone) {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'fg_drivo_secure_hmac_secret_2026';
  const timestamp = Date.now();
  const payload = `${userId || 'u'}:${phone}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${appConfig.auth.tokenPrefix}${Buffer.from(`${payload}:${signature}`).toString('base64url')}`;
}

export class AuthController {
  static async checkPhone(req, res) {
    const { phone } = req.body;
    const cleanPhone = (phone || '').trim();
    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 8) {
      throw new ApiError('A valid mobile phone number is required.', 400);
    }
    const user = await db.findUserByPhone(cleanPhone);
    return res.json({
      success: true,
      exists: !!user,
      message: user ? 'Mobile number is registered.' : 'Mobile number is not registered.',
    });
  }

  static async sendOtp(req, res) {
    const { phone, provider: requestedProvider, mode } = req.body;
    const cleanPhone = (phone || '').trim();
    const authMode = (mode || 'login').toLowerCase();
    const provider = (requestedProvider || process.env.SMS_GATEWAY_PROVIDER || 'fast2sms').toLowerCase();

    // Check rate limit / flooding (minimum 30s interval between requests)
    const existingEntry = otpStore.get(cleanPhone);
    if (existingEntry && existingEntry.lastSentAt && Date.now() - existingEntry.lastSentAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existingEntry.lastSentAt)) / 1000);
      throw new ApiError(`Please wait ${waitSeconds} seconds before requesting a new OTP.`, 429);
    }

    // Check database to separate Login vs Sign Up
    const existingUser = await db.findUserByPhone(cleanPhone);

    if (authMode === 'signup' && existingUser) {
      throw new ApiError('This mobile number is already registered! Please switch to Log In.', 409);
    }

    if (authMode === 'login' && !existingUser) {
      throw new ApiError('No account found with this mobile number! Please Sign Up first.', 404);
    }

    // Always generate a fresh, cryptographically strong random 6-digit OTP
    const randomOtp = crypto.randomInt(100000, 999999).toString();
    const code = randomOtp;
    const expiresAt = Date.now() + appConfig.auth.otpExpiryMinutes * 60 * 1000;
    const now = Date.now();

    // Store in-memory by formatted phone and 10-digit phone
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);
    const storeEntry = { code, expiresAt, attempts: 0, lastSentAt: now };
    otpStore.set(cleanPhone, storeEntry);
    if (tenDigits) otpStore.set(tenDigits, storeEntry);

    const maskedPhone = cleanPhone.replace(/(\d{2})\d{4}(\d{4})/, '$1••••$2');

    // Prevent SSRF: Only use server-configured SMS webhook environment variable
    const serverWebhookUrl = process.env.N8N_WEBHOOK_URL || process.env.SMS_WEBHOOK_URL || null;

    // Dispatch via SMS Gateway / n8n Webhook
    const dispatchResult = await SMSService.sendOtp({ phone: cleanPhone, code, provider, webhookUrl: serverWebhookUrl });

    // If external gateway generated a specific OTP, sync it
    const activeCode = dispatchResult.code || code;
    if (activeCode !== code) {
      storeEntry.code = activeCode;
      otpStore.set(cleanPhone, storeEntry);
      if (tenDigits) otpStore.set(tenDigits, storeEntry);
    }

    // Never transmit the plain OTP code over the wire in HTTP response body
    return res.json({
      success: true,
      message: dispatchResult.error
        ? `SMS/n8n Gateway: ${dispatchResult.error}`
        : 'Verification OTP dispatched successfully.',
      maskedPhone,
      expiresInSeconds: appConfig.auth.otpExpiryMinutes * 60,
      provider: dispatchResult.provider || provider,
      deliveryStatus: dispatchResult.success === false ? 'failed' : 'sent',
      gatewayError: dispatchResult.error || null,
    });
  }

  static async verifyOtp(req, res) {
    const { phone, otp, name, email, mode } = req.body;
    const cleanPhone = (phone || '').trim();
    const cleanOtp = (otp || '').trim();
    const authMode = (mode || 'login').toLowerCase();
    const rawDigits = cleanPhone.replace(/[^0-9]/g, '');
    const tenDigits = rawDigits.slice(-10);

    const cached = otpStore.get(cleanPhone) || otpStore.get(phone) || (tenDigits ? otpStore.get(tenDigits) : null);

    // Brute-force protection: Lock out after 5 consecutive failed attempts
    if (cached && cached.attempts >= 5) {
      otpStore.delete(cleanPhone);
      otpStore.delete(phone);
      if (tenDigits) otpStore.delete(tenDigits);
      throw new ApiError('Too many failed verification attempts. This OTP has been invalidated for security. Please request a new OTP.', 429);
    }

    // Master testing code (529481) strictly disabled in production
    const isProd = process.env.NODE_ENV === 'production';
    const isDemoMatch = !isProd && cleanOtp === appConfig.auth.demoOtp;
    const isStoreMatch = cached && cached.code === cleanOtp && cached.expiresAt > Date.now();

    const isValid = isDemoMatch || isStoreMatch;

    if (!isValid) {
      if (cached) {
        cached.attempts = (cached.attempts || 0) + 1;
        if (cached.attempts >= 5) {
          otpStore.delete(cleanPhone);
          otpStore.delete(phone);
          if (tenDigits) otpStore.delete(tenDigits);
          throw new ApiError('Too many failed verification attempts. Please request a new OTP.', 429);
        }
      }
      throw new ApiError('Invalid or expired verification OTP. Please try again.', 400);
    }

    // Clear used OTP immediately
    otpStore.delete(cleanPhone);
    otpStore.delete(phone);
    if (tenDigits) otpStore.delete(tenDigits);

    // Check user existence
    const existingUser = await db.findUserByPhone(cleanPhone);
    let user;

    if (authMode === 'login') {
      if (!existingUser) {
        throw new ApiError('No account found for this mobile number. Please Sign Up first.', 404);
      }
      user = existingUser;
      db.set('user', existingUser);
      if (db.pgPool && db.isPostgresConnected) {
        try {
          const userRidesRes = await db.pgPool.query('SELECT * FROM rides WHERE user_id = $1 ORDER BY created_at DESC', [existingUser.id]);
          if (userRidesRes && userRidesRes.rows) {
            db.set('rides', userRidesRes.rows.map(row => ({
              id: row.id,
              date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              status: row.status,
              category: row.category || 'FG DRIVO Sedan',
              pickup: row.pickup_name,
              pickupCoords: row.pickup_coords,
              destination: row.drop_name,
              destinationCoords: row.drop_coords,
              fare: parseFloat(row.fare),
              distance: row.distance || '0 km',
              duration: row.duration || '0 mins',
              driver: row.driver_name,
              vehicle: row.vehicle_info,
              ratingGiven: row.rating_given,
              paymentMethod: row.payment_method,
            })));
          }
          const userTxRes = await db.pgPool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC', [existingUser.id]);
          if (db.data.wallet) {
            db.data.wallet.balance = parseFloat(existingUser.walletBalance || 0.0);
            if (userTxRes && userTxRes.rows) {
              db.data.wallet.transactions = userTxRes.rows.map(row => ({
                id: row.id,
                title: row.title || row.description || 'Transaction',
                date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                amount: parseFloat(row.amount),
                type: row.type,
                status: row.status,
                gatewayRef: row.gateway_ref,
              }));
            }
          }
        } catch (e) {
          console.warn('[PostgreSQL Engine] User state sync error:', e.message);
        }
      }
    } else {
      // authMode === 'signup'
      if (existingUser) {
        throw new ApiError('This mobile number is already registered! Please switch to Log In.', 409);
      }
      user = await db.createUser({
        phone: cleanPhone,
        name: name || req.body.name,
        email: email || req.body.email,
      });
    }

    const token = generateSignedToken(user.id, cleanPhone);

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user,
    });
  }

  static async checkEmail(req, res) {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new ApiError('A valid email address is required.', 400);
    }
    const user = await db.findUserByEmail(cleanEmail);
    return res.json({
      success: true,
      exists: !!user,
      message: user ? 'Email is registered.' : 'Email is not registered.',
    });
  }

  static async socialLogin(req, res) {
    const { email, name, provider, avatar } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new ApiError('Email is required for social verification.', 400);
    }

    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser && existingUser.phone) {
      const token = generateSignedToken(existingUser.id, existingUser.phone);
      return res.json({
        success: true,
        exists: true,
        isPhoneLinked: true,
        message: 'Social account verified. Login successful.',
        token,
        user: existingUser,
      });
    }

    return res.json({
      success: true,
      exists: !!existingUser,
      isPhoneLinked: false,
      message: 'Social account verified. Mobile number required to link for ride dispatch.',
      profile: {
        email: cleanEmail,
        name: (existingUser && existingUser.name) || name || `${provider === 'apple' ? 'Apple' : 'Google'} User`,
        avatar: (existingUser && existingUser.avatar) || avatar || '',
      },
    });
  }
}
