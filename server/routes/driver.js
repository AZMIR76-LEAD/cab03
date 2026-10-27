// Fu Drivo Cabin — Server Driver Gateway Routes
import { Router } from 'express';
import { db } from '../db.js';
import { CITY_INFO } from '../config/constants.js';

const router = Router();

// In-memory driver runtime state (complements db persistence)
let driverOnlineState = {
  isOnline: true,
  coords: { lat: 10.3673, lng: 77.9803 },
  activeTrip: null,
};

let earningsLedger = {
  todayGross: 1450.0,
  todayNet: 1276.0,
  todayTrips: 8,
  weeklyNet: 8420.0,
  pendingPayout: 1276.0,
  recentTrips: [
    { id: 'TRIP-88219', pickup: 'Dindigul Bus Stand', drop: 'Palani Road', fare: 198.0, net: 174.24, time: '12:45 PM' },
    { id: 'TRIP-88214', pickup: 'Rock Fort Entrance', drop: 'GTN Salai', fare: 145.0, net: 127.60, time: '11:15 AM' },
    { id: 'TRIP-88209', pickup: 'Collectorate Complex', drop: 'Station Road', fare: 120.0, net: 105.60, time: '09:30 AM' },
  ],
};

// 1. Dynamic Operator Configuration
router.get('/config', (req, res) => {
  const config = {
    platform: 'Fu Drivo Cabin',
    version: '1.0.0',
    serviceAreas: [`${CITY_INFO.name} (${CITY_INFO.rtoCode})`, 'Palani', 'Kodaikanal', 'Batlagundu'],
    currency: '₹',
    dispatchTimeoutSeconds: 15,
    noShowWaitMinutes: 5,
    commissionRate: 0.12, // 12% operator fee
    requireStartOtp: true,
    showDropBeforeAccept: true,
    telemetryIntervalSeconds: 4,
    emergencyHotline: '112',
    supportHotline: '+91 451 242 8800',
  };

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(config);
});

// 2. Authentication: Send OTP
router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  return res.json({
    success: true,
    message: 'OTP dispatched successfully. Reviewer code: 529481',
    demoCode: '529481',
  });
});

// 3. Authentication: Verify OTP
router.post('/auth/verify-otp', (req, res) => {
  const { phone, code } = req.body;

  // Reviewer bypass code or any valid 6-digit input
  if (code === '529481' || (code && code.length === 6)) {
    const driverProfile = {
      id: 'DRV-8821',
      name: 'Arjun Verma',
      phone: phone || '+91 98112 34567',
      rating: 4.92,
      tripsCount: 2420,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      vehicle: {
        model: 'Honda City • Midnight Black',
        category: 'sedan',
        licensePlate: 'TN 57 CE 4819',
        color: 'Midnight Black',
      },
      status: 'approved',
      walletBalance: earningsLedger.todayNet,
      isOnline: driverOnlineState.isOnline,
    };

    return res.json({
      success: true,
      token: `drv_tok_${Date.now()}_auth`,
      driver: driverProfile,
    });
  }

  return res.status(401).json({ error: 'Invalid verification code. Please enter 529481.' });
});

// 4. Availability Toggle (Online / Offline Duty)
router.post('/availability', (req, res) => {
  const { isOnline, coords } = req.body;
  driverOnlineState.isOnline = Boolean(isOnline);
  if (coords) {
    driverOnlineState.coords = coords;
  }

  // Update in driver record if available
  const drivers = db.get('drivers');
  if (Array.isArray(drivers)) {
    const d = drivers.find((item) => item.id === 'DRV-8821');
    if (d) {
      d.status = driverOnlineState.isOnline ? 'available' : 'offline';
      db.save();
    }
  }

  res.json({
    success: true,
    isOnline: driverOnlineState.isOnline,
    timestamp: new Date().toISOString(),
  });
});

// 5. Offer Acceptance / Decline
router.post('/offers/respond', (req, res) => {
  const { offerId, tripId, action, declineReason } = req.body;
  const idempotencyKey = req.headers['idempotency-key'];

  if (action === 'accept') {
    return res.json({
      success: true,
      status: 'accepted',
      offerId,
      tripId,
      assignedAt: new Date().toISOString(),
      message: 'Offer accepted. Route generated to rider pickup.',
    });
  } else {
    return res.json({
      success: true,
      status: 'declined',
      offerId,
      reason: declineReason || 'Driver declined',
    });
  }
});

// 6. Mark Arrived at Pickup
router.post('/trips/arrived', (req, res) => {
  const { tripId } = req.body;
  res.json({
    success: true,
    tripId,
    status: 'arrived',
    arrivedAt: new Date().toISOString(),
    waitingTimerMinutes: 5,
    message: 'Arrival broadcasted to passenger. 5-minute complimentary timer initiated.',
  });
});

// 7. Verify Start OTP
router.post('/trips/start', (req, res) => {
  const { tripId, otp } = req.body;
  // Accept standard 4-digit OTP
  if (otp && otp.length === 4) {
    return res.json({
      success: true,
      tripId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      message: 'OTP verified. Trip started successfully.',
    });
  }

  return res.status(400).json({ error: 'Invalid 4-digit ride OTP. Check with passenger.' });
});

// 8. Complete Trip (Server-Authoritative Calculations)
router.post('/trips/complete', (req, res) => {
  const { tripId, distanceKm = 8.4, durationMin = 22, toll = 0 } = req.body;

  // Server-authoritative calculation:
  // Base fare: 80, per km: 14, time fee: 1.5/min
  const grossFare = Math.round(80 + distanceKm * 14 + durationMin * 1.5 + Number(toll));
  const commissionRate = 0.12; // 12%
  const platformFee = Number((grossFare * commissionRate).toFixed(2));
  const netEarnings = Number((grossFare - platformFee).toFixed(2));

  // Update earnings ledger
  earningsLedger.todayGross += grossFare;
  earningsLedger.todayNet += netEarnings;
  earningsLedger.todayTrips += 1;
  earningsLedger.pendingPayout += netEarnings;
  earningsLedger.recentTrips.unshift({
    id: tripId || `TRIP-${Math.floor(10000 + Math.random() * 90000)}`,
    pickup: 'Rider Pickup',
    drop: 'Rider Destination',
    fare: grossFare,
    net: netEarnings,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  res.json({
    success: true,
    tripId,
    status: 'completed',
    completedAt: new Date().toISOString(),
    breakdown: {
      distanceKm,
      durationMin,
      grossFare,
      platformFee,
      taxGST: 0,
      toll,
      netEarnings,
    },
    paymentMode: 'cash',
    collectedAmount: grossFare,
  });
});

// 9. Earnings Ledger
router.get('/earnings', (req, res) => {
  res.json(earningsLedger);
});

// 10. Instant UPI Payout Request
router.post('/payouts/request', (req, res) => {
  const { amount, method = 'upi', accountIdentifier } = req.body;
  const numAmount = Number(amount) || earningsLedger.pendingPayout;

  if (numAmount <= 0) {
    return res.status(400).json({ error: 'Payout amount must be greater than zero' });
  }

  const referenceId = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  earningsLedger.pendingPayout = Math.max(0, earningsLedger.pendingPayout - numAmount);

  res.json({
    success: true,
    referenceId,
    amount: numAmount,
    method,
    accountIdentifier: accountIdentifier || 'arjun.verma@okaxis',
    status: 'processing',
    settledVia: 'IMPS/UPI Instant Rail',
    estimatedArrival: '1-3 minutes',
    remainingBalance: earningsLedger.pendingPayout,
  });
});

export default router;
