import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DispatchAlgorithmService } from '../../server/services/dispatchAlgorithmService.js';

describe('Unit Tests: Dispatch Algorithm Service', () => {
  it('should compute zero distance for identical coordinates', () => {
    const point = { lat: 10.3644, lng: 77.9702 };
    const dist = DispatchAlgorithmService.haversineDistance(point, point);
    assert.strictEqual(dist, 0);
  });

  it('should accurately compute distance between Dindigul Junction and Palani Road', () => {
    const p1 = { lat: 10.3644, lng: 77.9702 }; // Dindigul Junction
    const p2 = { lat: 10.3812, lng: 77.9480 }; // Palani Road
    const dist = DispatchAlgorithmService.haversineDistance(p1, p2);

    assert.ok(dist > 2.0 && dist < 4.0, `Expected distance ~3km, got ${dist}km`);
  });

  it('should calculate valid bearing in degrees (0 - 360)', () => {
    const p1 = { lat: 10.3644, lng: 77.9702 };
    const p2 = { lat: 10.3812, lng: 77.9480 };
    const bearing = DispatchAlgorithmService.calculateBearing(p1, p2);

    assert.ok(bearing >= 0 && bearing <= 360);
  });

  it('should select optimal driver based on category and proximity', () => {
    const pickupCoords = { lat: 10.3644, lng: 77.9702 };
    const mockDrivers = [
      {
        id: 'D1',
        name: 'Far Driver',
        status: 'available',
        geo: { lat: 10.4500, lng: 78.0200 },
        coords: { x: 90, y: 10 },
        vehicle: { category: 'sedan' },
        rating: 4.8,
        tripsCount: 500,
      },
      {
        id: 'D2',
        name: 'Near Driver',
        status: 'available',
        geo: { lat: 10.3645, lng: 77.9703 },
        coords: { x: 50, y: 50 },
        vehicle: { category: 'sedan' },
        rating: 4.9,
        tripsCount: 1200,
      },
    ];

    const result = DispatchAlgorithmService.findOptimalCaptain(pickupCoords, 'sedan', mockDrivers);
    assert.ok(result);
    assert.strictEqual(result.selectedCaptain.id, 'D2');
  });
});
