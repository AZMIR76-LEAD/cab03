import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFare, getAllFareEstimates } from '../../server/services/pricingService.js';
import { VEHICLE_PRICING } from '../../server/config/constants.js';

describe('Unit Tests: Pricing Service', () => {
  it('should calculate valid fare for Sedan with base fare, distance, and duration', () => {
    const distanceKm = 10;
    const durationMin = 20;
    const result = calculateFare('sedan', distanceKm, durationMin);

    assert.ok(result);
    assert.strictEqual(typeof result.total, 'number');
    assert.ok(result.total > 0);
    assert.strictEqual(result.category, 'sedan');
    assert.ok(result.breakdown);
    assert.strictEqual(typeof result.breakdown.baseFare, 'number');
    assert.strictEqual(typeof result.breakdown.distanceFare, 'number');
    assert.strictEqual(typeof result.breakdown.timeFare, 'number');
    assert.strictEqual(typeof result.breakdown.taxes, 'number');
  });

  it('should calculate estimates for all vehicle fleet categories', () => {
    const estimates = getAllFareEstimates(8.5, 25);
    assert.ok(Array.isArray(estimates));
    assert.ok(estimates.length >= 4);

    const categories = estimates.map((e) => e.id);
    assert.ok(categories.includes('mini'));
    assert.ok(categories.includes('sedan'));
    assert.ok(categories.includes('suv'));
    assert.ok(categories.includes('premium'));
  });

  it('should ensure SUV fare is higher than Mini fare for same distance and duration', () => {
    const miniFare = calculateFare('mini', 12, 30);
    const suvFare = calculateFare('suv', 12, 30);

    assert.ok(suvFare.total > miniFare.total, 'SUV fare must exceed Mini fare');
  });

  it('should properly apply minimum base fare when distance is 0', () => {
    const sedan = calculateFare('sedan', 0, 0);
    assert.ok(sedan.total >= VEHICLE_PRICING.sedan.base);
  });
});
