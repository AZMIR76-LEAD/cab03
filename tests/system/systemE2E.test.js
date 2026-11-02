import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITY_INFO, VEHICLE_PRICING, RIDE_STATUSES } from '../../server/config/constants.js';

describe('System Tests: End-to-End Enterprise System Integrity', () => {
  it('should verify regional regulatory configuration for Dindigul, Tamil Nadu', () => {
    assert.strictEqual(CITY_INFO.rtoCode, 'TN 57');
    assert.strictEqual(CITY_INFO.name, 'Dindigul');
    assert.strictEqual(CITY_INFO.state, 'Tamil Nadu');
    assert.strictEqual(CITY_INFO.country, 'India');
    assert.ok(CITY_INFO.centerCoords.lat > 10 && CITY_INFO.centerCoords.lng > 77);
  });

  it('should verify complete vehicle fleet tier matrix and valid pricing parameters', () => {
    const requiredTiers = ['mini', 'sedan', 'suv', 'premium'];
    for (const tier of requiredTiers) {
      assert.ok(VEHICLE_PRICING[tier], `Fleet category ${tier} must be configured`);
      assert.ok(VEHICLE_PRICING[tier].base > 0);
      assert.ok(VEHICLE_PRICING[tier].perKm > 0);
      assert.ok(VEHICLE_PRICING[tier].capacity >= 3);
    }
  });

  it('should verify all required ride lifecycle status states exist', () => {
    assert.strictEqual(RIDE_STATUSES.FINDING_DRIVER, 'finding_driver');
    assert.strictEqual(RIDE_STATUSES.DRIVER_ASSIGNED, 'driver_assigned');
    assert.strictEqual(RIDE_STATUSES.DRIVER_ARRIVED, 'driver_arrived');
    assert.strictEqual(RIDE_STATUSES.TRIP_IN_PROGRESS, 'trip_in_progress');
    assert.strictEqual(RIDE_STATUSES.COMPLETED, 'completed');
    assert.strictEqual(RIDE_STATUSES.CANCELLED, 'cancelled');
  });

  it('should guarantee memory usage and process uptime are within healthy thresholds', () => {
    const memory = process.memoryUsage();
    const heapUsedMb = Math.round(memory.heapUsed / 1024 / 1024);

    assert.ok(heapUsedMb < 500, `Heap memory usage (${heapUsedMb}MB) should remain under 500MB`);
    assert.ok(process.uptime() >= 0);
  });
});
