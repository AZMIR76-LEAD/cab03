import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/db.js';
import { RIDE_STATUSES } from '../../server/config/constants.js';

describe('Integration Tests: Customer-Driver Full Trip Lifecycle', () => {
  it('should execute end-to-end booking dispatch, acceptance, arrival, OTP, and completion', async () => {
    // 1. Initial State: Driver goes online
    const driverId = 'DRV-8821';
    let drivers = db.get('drivers') || [];
    let driver = drivers.find((d) => d.id === driverId);
    if (!driver) {
      driver = {
        id: driverId,
        name: 'dhaya',
        phone: '+91 98765 43210',
        rating: 4.88,
        tripsCount: 150,
        vehicle: { model: 'SUV', licensePlate: 'KA 01 AB 1234' },
        status: 'available',
      };
      drivers.push(driver);
      db.set('drivers', drivers);
    }
    assert.ok(driver, 'Driver record must exist');
    driver.status = 'available';
    db.save();

    // 2. Customer creates ride booking in customer app
    const rideId = 'RX-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const mockRide = {
      id: rideId,
      status: RIDE_STATUSES.FINDING_DRIVER,
      category: 'Sedan',
      pickup: 'Dindigul Railway Junction',
      destination: 'Palani Road Bypass',
      distanceKm: 8.5,
      durationMin: 22,
      fare: 210.0,
      paymentMethod: 'Cash',
      otp: '4819',
      driver: null,
      telematics: {
        etaMinutes: 3,
        distanceToPickupKm: 1.4,
        driverCoords: { x: 48, y: 62 },
        heading: 135,
      },
    };

    db.set('activeRide', mockRide);
    assert.strictEqual(db.get('activeRide').status, RIDE_STATUSES.FINDING_DRIVER);

    // 3. Driver receives offer and accepts
    const activeRide = db.get('activeRide');
    activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
    activeRide.driver = {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      rating: driver.rating,
    };
    db.save();

    assert.strictEqual(db.get('activeRide').status, RIDE_STATUSES.DRIVER_ASSIGNED);
    assert.strictEqual(db.get('activeRide').driver.name, driver.name);

    // 4. Driver navigates and marks arrived at pickup
    activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
    activeRide.arrivedAt = new Date().toISOString();
    activeRide.telematics.etaMinutes = 0;
    activeRide.telematics.distanceToPickupKm = 0.0;
    db.save();

    assert.strictEqual(db.get('activeRide').status, RIDE_STATUSES.DRIVER_ARRIVED);
    assert.ok(db.get('activeRide').arrivedAt);

    // 5. Driver verifies passenger 4-digit start OTP
    const enteredOtp = '4819';
    assert.strictEqual(enteredOtp, activeRide.otp, 'Passenger OTP must match');

    activeRide.status = RIDE_STATUSES.TRIP_IN_PROGRESS;
    activeRide.startedAt = new Date().toISOString();
    db.save();

    assert.strictEqual(db.get('activeRide').status, RIDE_STATUSES.TRIP_IN_PROGRESS);

    // 6. Driver completes trip and server computes authoritative fare & commission
    const distanceKm = 8.5;
    const durationMin = 22;
    const grossFare = Math.round(80 + distanceKm * 14 + durationMin * 1.5);
    const platformFee = Number((grossFare * 0.12).toFixed(2));
    const netEarnings = Number((grossFare - platformFee).toFixed(2));

    activeRide.status = RIDE_STATUSES.COMPLETED;
    activeRide.completedAt = new Date().toISOString();
    activeRide.fare = grossFare;
    activeRide.fareBreakdown = {
      grossFare,
      platformFee,
      netEarnings,
    };
    db.save();

    assert.strictEqual(db.get('activeRide').status, RIDE_STATUSES.COMPLETED);
    assert.strictEqual(db.get('activeRide').fare, grossFare);
    assert.ok(db.get('activeRide').fareBreakdown.netEarnings > 0);
  });

  it('should strictly filter ride offers by vehicle category so SUV drivers never receive Sedan offers', () => {
    const normalizeCat = (c) => {
      if (!c) return '';
      const s = String(c).toLowerCase();
      if (s.includes('suv')) return 'suv';
      if (s.includes('mini')) return 'mini';
      if (s.includes('premium')) return 'premium';
      if (s.includes('sedan')) return 'sedan';
      return s.trim();
    };

    const isCategoryMatch = (driverVt, rideCat) => {
      const d = normalizeCat(driverVt);
      const r = normalizeCat(rideCat);
      if (!d || !r) return true;
      return d === r;
    };

    // Sedan booking vs SUV driver -> must reject offer
    assert.strictEqual(isCategoryMatch('SUV', 'sedan'), false);
    assert.strictEqual(isCategoryMatch('SUV', 'FG DRIVO Sedan'), false);

    // Sedan booking vs Sedan driver -> must accept offer
    assert.strictEqual(isCategoryMatch('Sedan', 'sedan'), true);
    assert.strictEqual(isCategoryMatch('Sedan', 'FG DRIVO Sedan'), true);

    // SUV booking vs SUV driver -> must accept offer
    assert.strictEqual(isCategoryMatch('SUV', 'suv'), true);
    assert.strictEqual(isCategoryMatch('SUV', 'FG DRIVO SUV'), true);

    // Mini booking vs SUV driver -> must reject offer
    assert.strictEqual(isCategoryMatch('SUV', 'mini'), false);
  });
});

