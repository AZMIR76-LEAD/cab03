// FG DRIVO Authentication Controller
import { db } from '../db.js';
import { appConfig } from '../config/appConfig.js';
import { ApiError } from '../middleware/errorHandler.js';
import { SMSService } from '../services/smsService.js';

// In-memory verification cache with TTL: phone -> { code, expiresAt }
const otpStore = new Map();

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
      user: user ? { id: user.id, name: user.name, phone: user.phone } : null,
      message: user ? 'Mobile number is registered.' : 'Mobile number is not registered.',
    });
  }

  static async sendOtp(req, res) {
    const { phone, provider: requestedProvider, webhookUrl, mode } = req.body;
    const cleanPhone = (phone || '').trim();
    const authMode = (mode || 'login').toLowerCase();
    const provider = (requestedProvider || process.env.SMS_GATEWAY_PROVIDER || 'fast2sms').toLowerCase();

    // Check database to separate Login vs Sign Up
    const existingUser = await db.findUserByPhone(cleanPhone);

    if (authMode === 'signup' && existingUser) {
      throw new ApiError('This mobile number is already registered! Please switch to Log In.', 409);
    }

    if (authMode === 'login' && !existingUser) {
      throw new ApiError('No account found with this mobile number! Please Sign Up first.', 404);
    }

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

    // Dispatch via SMS Gateway / n8n Webhook
    const dispatchResult = await SMSService.sendOtp({ phone: cleanPhone, code, provider, webhookUrl });

    // If n8n or external gateway generated a specific OTP, sync it
    const activeCode = dispatchResult.code || code;
    if (activeCode !== code) {
      otpStore.set(cleanPhone, { code: activeCode, expiresAt });
      if (tenDigits) otpStore.set(tenDigits, { code: activeCode, expiresAt });
    }

    return res.json({
      success: true,
      message: dispatchResult.error
        ? `SMS/n8n Gateway: ${dispatchResult.error}`
        : 'Verification OTP dispatched successfully.',
      code: activeCode,
      demoCode: activeCode,
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

    const token = `${appConfig.auth.tokenPrefix}${Buffer.from(`${cleanPhone}_${Date.now()}`).toString('base64')}`;

    return res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user,
    });
  }
}
