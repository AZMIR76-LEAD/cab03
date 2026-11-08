import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Unit Tests: Driver Standalone Features & KYC Rules', () => {
  it('should validate driver age is at least 18 years old', () => {
    const isAgeValid = (dobString) => {
      const birthDate = new Date(dobString);
      const ageMs = Date.now() - birthDate.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      return ageYears >= 18 && ageYears <= 75;
    };

    assert.strictEqual(isAgeValid('2000-01-01'), true, '26-year-old is valid');
    assert.strictEqual(isAgeValid('2015-05-10'), false, '11-year-old is rejected');
    assert.strictEqual(isAgeValid('1940-01-01'), false, '86-year-old is over maximum limit');
  });

  it('should validate 12-digit Indian Aadhaar number format', () => {
    const isAadhaarValid = (num) => typeof num === 'string' && /^[2-9]\d{11}$/.test(num.trim());

    assert.strictEqual(isAadhaarValid('548912345678'), true);
    assert.strictEqual(isAadhaarValid('123456789012'), false, 'Cannot start with 0 or 1');
    assert.strictEqual(isAadhaarValid('54891234'), false, 'Must be 12 digits');
    assert.strictEqual(isAadhaarValid('54891234567899'), false, 'Cannot exceed 12 digits');
  });

  it('should validate Indian Driving License format according to MoRTH standard', () => {
    const isDLValid = (dl) => {
      const clean = dl.trim().replace(/[-\s]/g, '').toUpperCase();
      return /^[A-Z]{2}\d{13,15}$/.test(clean);
    };

    assert.strictEqual(isDLValid('TN57 20240001234'), true);
    assert.strictEqual(isDLValid('TN-57-20240001234'), true);
    assert.strictEqual(isDLValid('KA0120220098765'), true);
    assert.strictEqual(isDLValid('123456789012345'), false, 'Must start with state code');
  });

  it('should validate Indian UPI ID format with common PSP handles', () => {
    const isUpiValid = (upi) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim());

    assert.strictEqual(isUpiValid('driver@okaxis'), true);
    assert.strictEqual(isUpiValid('captain.murugan@oksbi'), true);
    assert.strictEqual(isUpiValid('9876543210@paytm'), true);
    assert.strictEqual(isUpiValid('invalid-upi'), false);
    assert.strictEqual(isUpiValid('@okaxis'), false);
  });

  it('should calculate 10% platform commission correctly in Royal Revenue Summary', () => {
    const calculateRoyalRevenue = (grossTotal) => {
      const commissionRate = 0.10;
      const commission = Number((grossTotal * commissionRate).toFixed(2));
      const net = Number((grossTotal - commission).toFixed(2));
      return { gross: grossTotal, commission, net };
    };

    const res = calculateRoyalRevenue(2450.0);
    assert.strictEqual(res.gross, 2450.0);
    assert.strictEqual(res.commission, 245.0);
    assert.strictEqual(res.net, 2205.0);
  });
});

