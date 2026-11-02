import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Unit Tests: Driver Earnings & Commission Engine', () => {
  const calculateDriverShare = (distanceKm, durationMin, toll = 0) => {
    const grossFare = Math.round(80 + distanceKm * 14 + durationMin * 1.5 + Number(toll));
    const commissionRate = 0.12; // 12% Fu Drivo platform commission
    const platformFee = Number((grossFare * commissionRate).toFixed(2));
    const netEarnings = Number((grossFare - platformFee).toFixed(2));
    return { grossFare, platformFee, netEarnings };
  };

  it('should accurately calculate gross, commission, and net earnings for a standard trip', () => {
    const distanceKm = 8.0;
    const durationMin = 20;
    const toll = 0;

    const result = calculateDriverShare(distanceKm, durationMin, toll);
    // Base (80) + Distance (8 * 14 = 112) + Duration (20 * 1.5 = 30) = 222
    assert.strictEqual(result.grossFare, 222);
    // 222 * 0.12 = 26.64
    assert.strictEqual(result.platformFee, 26.64);
    // 222 - 26.64 = 195.36
    assert.strictEqual(result.netEarnings, 195.36);
  });

  it('should ensure platform fee plus driver net exactly equals gross fare', () => {
    const result = calculateDriverShare(14.5, 35, 45);
    const sum = Number((result.platformFee + result.netEarnings).toFixed(2));
    assert.strictEqual(sum, result.grossFare);
  });

  it('should correctly handle toll addition directly to gross fare', () => {
    const withoutToll = calculateDriverShare(10, 20, 0);
    const withToll = calculateDriverShare(10, 20, 60);

    assert.strictEqual(withToll.grossFare - withoutToll.grossFare, 60);
  });

  it('should reject non-positive payout amounts in UPI disbursement validation', () => {
    const validatePayoutAmount = (amount, currentBalance) => {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) return { valid: false, error: 'Amount must be greater than zero' };
      if (num > currentBalance) return { valid: false, error: 'Insufficient wallet balance' };
      return { valid: true };
    };

    assert.strictEqual(validatePayoutAmount(0, 1000).valid, false);
    assert.strictEqual(validatePayoutAmount(-50, 1000).valid, false);
    assert.strictEqual(validatePayoutAmount(1500, 1000).valid, false);
    assert.strictEqual(validatePayoutAmount(500, 1000).valid, true);
  });
});

