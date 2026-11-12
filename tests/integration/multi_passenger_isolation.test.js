import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/db.js';
import { RidesController } from '../../server/controllers/ridesController.js';
import { RIDE_STATUSES } from '../../server/config/constants.js';

describe('Integration Tests: Concurrent Multi-Passenger Isolation & Decline Logic', () => {
  const driverPhone = '9876543210';

  it('should support multiple concurrent bookings without overwriting', async () => {
    // 1. Customer 1 books Ride 1
    const req1 = {
      body: {
        category: 'sedan',
        pickup: 'Singarapalayam, Govindagudi',
        destination: 'Dindigul Bus Stand',
        fare: 426,
        riderName: 'Customer 1',
        riderPhone: '+91 94444 11111',
      },
    };
    let ride1Res = null;
    const res1 = {
      status: (code) => ({
        json: (data) => {
          ride1Res = data;
        },
      }),
    };
    await RidesController.bookRide(req1, res1);
    assert.ok(ride1Res && ride1Res.ride, 'Ride 1 should be created');
    const ride1Id = ride1Res.ride.id;

    // 2. Customer 2 books Ride 2
    const req2 = {
      body: {
        category: 'sedan',
        pickup: 'Dindigul Rock Fort',
        destination: 'Home (No. 14)',
        fare: 251,
        riderName: 'Customer 2',
        riderPhone: '+91 95555 22222',
      },
    };
    let ride2Res = null;
    const res2 = {
      status: (code) => ({
        json: (data) => {
          ride2Res = data;
        },
      }),
    };
    await RidesController.bookRide(req2, res2);
    assert.ok(ride2Res && ride2Res.ride, 'Ride 2 should be created');
    const ride2Id = ride2Res.ride.id;

    assert.notEqual(ride1Id, ride2Id, 'Ride IDs must be unique');

    // Both rides must be retrievable independently by rideId
    const fetchedRide1 = db.getActiveRide(ride1Id);
    const fetchedRide2 = db.getActiveRide(ride2Id);
    assert.equal(fetchedRide1.id, ride1Id);
    assert.equal(fetchedRide1.fare, 426);
    assert.equal(fetchedRide2.id, ride2Id);
    assert.equal(fetchedRide2.fare, 251);

    // 3. Driver declines Ride 1
    if (!fetchedRide1.declinedBy) fetchedRide1.declinedBy = [];
    fetchedRide1.declinedBy.push(driverPhone);
    db.saveActiveRide(fetchedRide1);

    // 4. Polling for driver should skip declined Ride 1 and return Ride 2
    const allRides = db.getAllActiveRides();
    const candidate = allRides.find((r) => {
      if (r.status !== RIDE_STATUSES.FINDING_DRIVER && r.status !== 'offered') return false;
      if (Array.isArray(r.declinedBy) && r.declinedBy.includes(driverPhone)) return false;
      return true;
    });

    assert.ok(candidate, 'Driver should find non-declined offer');
    assert.equal(candidate.id, ride2Id, 'Candidate must be Customer 2, NOT Customer 1');
    assert.equal(candidate.fare, 251, 'Fare must be Customer 2 fare');

    // 5. Driver accepts Ride 2
    const ride2ToAccept = db.getActiveRide(ride2Id);
    ride2ToAccept.status = RIDE_STATUSES.DRIVER_ASSIGNED;
    ride2ToAccept.driver = {
      id: 'DRV-3210',
      name: 'dhaya',
      phone: '+91 98765 43210',
      rating: 4.8,
    };
    db.saveActiveRide(ride2ToAccept);

    // Verify isolation: Ride 1 is still finding driver without driver assigned!
    const ride1After = db.getActiveRide(ride1Id);
    assert.equal(ride1After.status, RIDE_STATUSES.FINDING_DRIVER);
    assert.equal(ride1After.driver, null);

    // Ride 2 is assigned to dhaya!
    const ride2After = db.getActiveRide(ride2Id);
    assert.equal(ride2After.status, RIDE_STATUSES.DRIVER_ASSIGNED);
    assert.equal(ride2After.driver.name, 'dhaya');

    // Cleanup
    db.removeActiveRide(ride1Id);
    db.removeActiveRide(ride2Id);
  });
});

