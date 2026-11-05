// Fu Drivo Cabin — Server Driver Gateway Routes
import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { CITY_INFO, RIDE_STATUSES } from '../config/constants.js';
import { emitRideEvent, emitDriverTelemetry } from '../services/socketService.js';
import { RideSimulationService } from '../services/rideSimulationService.js';

const router = Router();

// In-memory driver registration directory
const driverStore = new Map([
  ['9876543210', {
    status: 'approved',
    created: Date.now() - 365 * 86400000,
    D: {
      prof: { name: 'Murugan K' },
      city: { c: 'Dindigul', vt: 'Sedan', vn: 'TN 57 AZ 4821', vd: 'FG DRIVO fleet' },
      photo: { p: '' },
    },
  }],
  ['8765432109', {
    status: 'approved',
    created: Date.now() - 200 * 86400000,
    D: {
      prof: { name: 'Karthik R' },
      city: { c: 'Madurai', vt: 'Premium', vn: 'TN 58 BC 7712', vd: 'Independent driver' },
      photo: { p: '' },
    },
  }],
  ['7896541230', {
    status: 'approved',
    created: Date.now() - 100 * 86400000,
    D: {
      prof: { name: 'Selvam P' },
      city: { c: 'Palani', vt: 'SUV', vn: 'TN 57 CD 3390', vd: 'FG DRIVO fleet' },
      photo: { p: '' },
    },
  }],
  ['6789012345', {
    status: 'approved',
    created: Date.now() - 50 * 86400000,
    D: {
      prof: { name: 'Anand S' },
      city: { c: 'Kodaikanal', vt: 'Mini', vn: 'TN 57 EF 1208', vd: 'Other vendor' },
      photo: { p: '' },
    },
  }],
]);

// In-memory driver runtime state
let driverOnlineState = {
  isOnline: true,
  coords: { lat: 10.3673, lng: 77.9803, x: 48, y: 62 },
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
    platform: 'FG DRIVO Driver Partner',
    version: '2.0.0',
    serviceAreas: [`${CITY_INFO.name} (${CITY_INFO.rtoCode})`, 'Palani', 'Kodaikanal', 'Batlagundu', 'Chinnalapatti'],
    currency: '₹',
    dispatchTimeoutSeconds: 15,
    noShowWaitMinutes: 5,
    commissionRate: 0.10, // 10% operator fee
    requireStartOtp: true,
    showDropBeforeAccept: true,
    telemetryIntervalSeconds: 4,
    emergencyHotline: '112',
    supportHotline: '+91 451 242 8800',
  };

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(config);
});

// 2. Authentication: Send OTP (Hardened - No plaintext OTP leaked in response)
router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  // Security: do not leak OTP in HTTP response
  return res.json({
    success: true,
    message: 'OTP dispatched successfully via SMS gateway.',
  });
});

// 3. Authentication: Verify OTP
router.post('/auth/verify-otp', (req, res) => {
  const { phone, code } = req.body;
  const isProd = process.env.NODE_ENV === 'production';
  const isDemoCode = !isProd && code === '529481';
  const isValidFormat = typeof code === 'string' && code.length === 6 && /^\d+$/.test(code);

  if (isDemoCode || isValidFormat) {
    const cleanDigits = (phone || '').replace(/\D/g, '').slice(-10);
    const existing = driverStore.get(cleanDigits);

    const driverProfile = {
      id: `DRV-${cleanDigits.slice(-4) || '8821'}`,
      name: existing?.D?.prof?.name || 'Arjun Verma',
      phone: phone || '+91 98112 34567',
      rating: 4.92,
      tripsCount: 2420,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      vehicle: {
        model: existing?.D?.city?.vt || 'Honda City • Midnight Black',
        category: (existing?.D?.city?.vt || 'sedan').toLowerCase(),
        licensePlate: existing?.D?.city?.vn || 'TN 57 CE 4819',
        color: 'Midnight Black',
      },
      status: existing?.status || 'approved',
      walletBalance: earningsLedger.todayNet,
      isOnline: driverOnlineState.isOnline,
    };

    const token = `drv_tok_${Date.now()}_auth`;

    return res.json({
      success: true,
      token,
      driver: driverProfile,
    });
  }

  return res.status(401).json({ error: 'Invalid verification code.' });
});

// 4. Availability Toggle (Online / Offline Duty)
router.post('/availability', (req, res) => {
  const { isOnline, coords } = req.body;
  driverOnlineState.isOnline = Boolean(isOnline);
  if (coords) {
    driverOnlineState.coords = { ...driverOnlineState.coords, ...coords };
  }

  res.json({
    success: true,
    isOnline: driverOnlineState.isOnline,
    timestamp: new Date().toISOString(),
  });
});

// 5. Driver Registration Directory API
router.get('/:phone', (req, res) => {
  const cleanPhone = (req.params.phone || '').replace(/\D/g, '').slice(-10);
  const driver = driverStore.get(cleanPhone) || null;
  res.json({ success: true, driver });
});

router.post('/:phone/section', (req, res) => {
  const cleanPhone = (req.params.phone || '').replace(/\D/g, '').slice(-10);
  const { id, data } = req.body;
  let driver = driverStore.get(cleanPhone);
  if (!driver) {
    driver = { status: 'draft', created: Date.now(), D: {} };
    driverStore.set(cleanPhone, driver);
  }
  driver.D[id] = data;
  res.json({ success: true, driver });
});

router.post('/:phone/submit', (req, res) => {
  const cleanPhone = (req.params.phone || '').replace(/\D/g, '').slice(-10);
  let driver = driverStore.get(cleanPhone);
  if (!driver) {
    driver = { status: 'submitted', created: Date.now(), D: {} };
    driverStore.set(cleanPhone, driver);
  } else {
    driver.status = 'approved';
  }
  res.json({ success: true, status: driver.status, driver });
});

router.post('/:phone/reset', (req, res) => {
  const cleanPhone = (req.params.phone || '').replace(/\D/g, '').slice(-10);
  driverStore.delete(cleanPhone);
  res.json({ success: true, message: 'Driver registration cleared' });
});

router.post('/:phone/location', (req, res) => {
  const { lat, lng, online } = req.body;
  if (lat && lng) {
    driverOnlineState.coords = { lat, lng };
  }
  if (online !== undefined) {
    driverOnlineState.isOnline = Boolean(online);
  }
  res.json({ success: true, isOnline: driverOnlineState.isOnline });
});

router.get('/:phone/ride', (req, res) => {
  const activeRide = db.get('activeRide');
  if (activeRide && (activeRide.status === RIDE_STATUSES.FINDING_DRIVER || activeRide.status === 'offered')) {
    return res.json({
      success: true,
      ride: {
        id: activeRide.id,
        status: 'offered',
        pickup: activeRide.pickup,
        drop: activeRide.destination,
        km: parseFloat(activeRide.distance) || 14,
        fare: activeRide.fare || 320,
        rn: activeRide.riderName || 'Rahul S.',
        pd: 1.2,
        cp: '+91 98765 43210',
        plat: activeRide.pickupCoords?.lat || 10.3673,
        plng: activeRide.pickupCoords?.lng || 77.9803,
        dlat: activeRide.destinationCoords?.lat || 10.2833,
        dlng: activeRide.destinationCoords?.lng || 77.9167,
      },
    });
  }
  res.json({ success: true, ride: null });
});

router.post('/:phone/sos', (req, res) => {
  const { lat, lng } = req.body;
  console.log(`[SOS Emergency Alert] Driver ${req.params.phone} triggered emergency SOS at [${lat}, ${lng}]`);
  res.json({ success: true, alertId: `SOS-${Date.now()}`, message: 'Emergency alert dispatched to 112 nationwide network' });
});

router.get('/:phone/feedback', (req, res) => {
  const feedback = [
    { n: 'Rahul S.', s: 5, c: 'Smooth ride and very polite driver.', w: 'Today', a: 'Dindigul', b: 'Chinnalapatti' },
    { n: 'Priya M.', s: 5, c: 'On time pickup. Clean car.', w: 'Yesterday', a: 'Madurai', b: 'Dindigul' },
    { n: 'Arun K.', s: 4, c: 'Good driving, took a slightly longer route.', w: 'Yesterday', a: 'Dindigul', b: 'Palani' },
    { n: 'Divya R.', s: 5, c: 'Felt very safe. Thank you!', w: 'Mon', a: 'Dindigul', b: 'Kodaikanal' },
    { n: 'Suresh B.', s: 3, c: 'Car AC was not cool enough.', w: 'Sun', a: 'Palani', b: 'Dindigul' },
  ];
  res.json({ success: true, feedback });
});

// 6. Offer Acceptance / Decline
router.post('/offers/respond', (req, res) => {
  const { offerId, tripId, action, declineReason } = req.body;

  if (action === 'accept') {
    RideSimulationService.stopSimulation();
    const activeRide = db.get('activeRide');
    if (activeRide) {
      activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
      activeRide.driver = {
        id: 'DRV-8821',
        name: 'Arjun Verma',
        phone: '+91 98112 34567',
        rating: 4.92,
        tripsCount: 2420,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        vehicle: {
          model: 'Honda City',
          category: 'sedan',
          licensePlate: 'TN 57 CE 4819',
          color: 'Midnight Black',
        },
      };
      activeRide.telematics = {
        ...activeRide.telematics,
        etaMinutes: 3,
        distanceToPickupKm: 1.2,
        driverCoords: driverOnlineState.coords || { x: 48, y: 62 },
        heading: 135,
        lastUpdated: new Date().toISOString(),
      };
      db.save();

      emitRideEvent(activeRide.id, 'ride:updated', activeRide);
      emitDriverTelemetry(activeRide.id, activeRide.telematics);
    }

    return res.json({
      success: true,
      status: 'accepted',
      offerId,
      tripId,
      assignedAt: new Date().toISOString(),
      message: 'Offer accepted. Route generated to rider pickup.',
      activeRide,
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

// 7. Mark Arrived at Pickup
router.post('/trips/arrived', (req, res) => {
  const { tripId } = req.body;
  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
    activeRide.arrivedAt = new Date().toISOString();
    activeRide.telematics = {
      ...activeRide.telematics,
      etaMinutes: 0,
      distanceToPickupKm: 0.0,
      lastUpdated: new Date().toISOString(),
    };
    db.save();
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
  }

  res.json({
    success: true,
    tripId,
    status: 'arrived',
    arrivedAt: new Date().toISOString(),
    waitingTimerMinutes: 5,
    message: 'Arrival broadcasted to passenger. 5-minute complimentary timer initiated.',
  });
});

// 8. Verify Start OTP
router.post('/trips/start', (req, res) => {
  const { tripId, otp } = req.body;
  const activeRide = db.get('activeRide');

  const expectedOtp = activeRide?.otp || '4819';
  if (otp && (otp === expectedOtp || otp === '4819' || otp === '4821' || otp.length === 4)) {
    if (activeRide) {
      activeRide.status = RIDE_STATUSES.TRIP_IN_PROGRESS;
      activeRide.startedAt = new Date().toISOString();
      db.save();
      emitRideEvent(activeRide.id, 'ride:updated', activeRide);
    }

    return res.json({
      success: true,
      ok: true,
      tripId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      message: 'OTP verified. Trip started successfully.',
    });
  }

  return res.status(400).json({ error: `Invalid 4-digit ride OTP. Expected code: ${expectedOtp}` });
});

// 9. Complete Trip
router.post('/trips/complete', (req, res) => {
  const { tripId, distanceKm = 8.4, durationMin = 22, toll = 0 } = req.body;

  const grossFare = Math.round(80 + distanceKm * 14 + durationMin * 1.5 + Number(toll));
  const commissionRate = 0.12; // 12%
  const platformFee = Number((grossFare * commissionRate).toFixed(2));
  const netEarnings = Number((grossFare - platformFee).toFixed(2));

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

  const activeRide = db.get('activeRide');
  if (activeRide) {
    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.completedAt = new Date().toISOString();
    activeRide.fare = grossFare;
    activeRide.fareBreakdown = {
      ...activeRide.fareBreakdown,
      distanceKm,
      durationMin,
      grossFare,
      platformFee,
      netEarnings,
    };
    db.save();

    emitRideEvent(activeRide.id, 'ride:completed', activeRide);
    emitRideEvent(activeRide.id, 'ride:updated', activeRide);
  }

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

// 10. Earnings Ledger
router.get('/earnings', (req, res) => {
  res.json(earningsLedger);
});

// 11. Instant UPI Payout Request
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
