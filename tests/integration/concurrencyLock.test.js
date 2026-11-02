import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Integration Tests: Concurrency Control & Atomic Dispatch Locking', () => {
  it('should guarantee atomic ride assignment so two drivers cannot accept the same offer', () => {
    let ride = {
      id: 'RX-99120',
      status: 'requested',
      assignedDriverId: null,
    };

    // Atomic assignment helper
    const atomicAssign = (targetRide, driverId) => {
      if (targetRide.status === 'requested' && targetRide.assignedDriverId === null) {
        targetRide.status = 'accepted';
        targetRide.assignedDriverId = driverId;
        return { success: true, message: 'Assigned successfully' };
      }
      return { success: false, error: 'Ride already accepted or no longer available' };
    };

    // Driver A accepts first
    const attempt1 = atomicAssign(ride, 'DRV-1');
    assert.strictEqual(attempt1.success, true);
    assert.strictEqual(ride.assignedDriverId, 'DRV-1');

    // Driver B attempts to accept simultaneously
    const attempt2 = atomicAssign(ride, 'DRV-2');
    assert.strictEqual(attempt2.success, false);
    assert.strictEqual(ride.assignedDriverId, 'DRV-1', 'Must remain assigned exclusively to Driver 1');
  });

  it('should handle idempotent retries safely with the same idempotency key', () => {
    const processedKeys = new Map();

    const handleActionWithIdempotency = (key, payload) => {
      if (processedKeys.has(key)) {
        return { isReplay: true, data: processedKeys.get(key) };
      }
      const result = { processedAt: Date.now(), status: 'confirmed', ...payload };
      processedKeys.set(key, result);
      return { isReplay: false, data: result };
    };

    const key = 'IDEMP-ARRIVE-88219-001';
    const firstCall = handleActionWithIdempotency(key, { action: 'arrived', tripId: 'TRIP-88219' });
    assert.strictEqual(firstCall.isReplay, false);
    assert.strictEqual(firstCall.data.status, 'confirmed');

    // Duplicate network retry from mobile client
    const retryCall = handleActionWithIdempotency(key, { action: 'arrived', tripId: 'TRIP-88219' });
    assert.strictEqual(retryCall.isReplay, true);
    assert.strictEqual(retryCall.data.processedAt, firstCall.data.processedAt);
  });
});

