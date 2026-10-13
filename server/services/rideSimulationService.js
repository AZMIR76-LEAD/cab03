// FG DRIVO Autonomous Ride Simulation Engine & State Machine
import { db } from '../db.js';
import { RIDE_STATUSES, RIDE_LIFECYCLE_STEPS } from '../config/constants.js';
import { emitRideEvent, emitDriverTelemetry } from './socketService.js';

let activeTimer = null;

// Telemetry coordinates along Dindigul city routes (0-100 normalized map grid)
const SIMULATION_TELEMETRY_STEPS = {
  [RIDE_STATUSES.FINDING_DRIVER]: {
    etaMinutes: 3,
    distanceToPickupKm: 1.8,
    driverCoords: { x: 50, y: 60 },
    heading: 135,
  },
  [RIDE_STATUSES.DRIVER_ASSIGNED]: {
    etaMinutes: 3,
    distanceToPickupKm: 1.4,
    driverCoords: { x: 48, y: 62 },
    heading: 135,
  },
  [RIDE_STATUSES.DRIVER_ARRIVING]: {
    etaMinutes: 2,
    distanceToPickupKm: 0.6,
    driverCoords: { x: 43, y: 66 },
    heading: 150,
  },
  [RIDE_STATUSES.DRIVER_ARRIVED]: {
    etaMinutes: 0,
    distanceToPickupKm: 0.0,
    driverCoords: { x: 38, y: 70 },
    heading: 180,
  },
  [RIDE_STATUSES.TRIP_STARTED]: {
    etaMinutes: 22,
    distanceToPickupKm: 0.0,
    driverCoords: { x: 42, y: 67 },
    heading: 90,
  },
  [RIDE_STATUSES.TRIP_IN_PROGRESS]: {
    etaMinutes: 11,
    distanceToPickupKm: 0.0,
    driverCoords: { x: 55, y: 51 },
    heading: 75,
  },
  [RIDE_STATUSES.COMPLETED]: {
    etaMinutes: 0,
    distanceToPickupKm: 0.0,
    driverCoords: { x: 72, y: 32 },
    heading: 45,
  },
};

export class RideSimulationService {
  static startSimulation(rideId) {
    this.stopSimulation();

    let stepIndex = 0;
    activeTimer = setInterval(() => {
      stepIndex++;

      const currentRide = db.get('activeRide');
      if (!currentRide || currentRide.id !== rideId) {
        RideSimulationService.stopSimulation();
        return;
      }

      if (currentRide.status === RIDE_STATUSES.COMPLETED || currentRide.status === RIDE_STATUSES.CANCELLED) {
        RideSimulationService.stopSimulation();
        return;
      }

      if (stepIndex < RIDE_LIFECYCLE_STEPS.length) {
        const nextStatus = RIDE_LIFECYCLE_STEPS[stepIndex];
        RideSimulationService.transitionStatus(currentRide, nextStatus);
      } else {
        RideSimulationService.stopSimulation();
      }
    }, 4500);
  }

  static stopSimulation() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  }

  static transitionStatus(ride, newStatus) {
    ride.status = newStatus;
    const telemetry = SIMULATION_TELEMETRY_STEPS[newStatus] || {
      etaMinutes: 0,
      driverCoords: { x: 50, y: 50 },
      heading: 0,
    };

    ride.telematics = {
      ...ride.telematics,
      ...telemetry,
      lastUpdated: new Date().toISOString(),
    };

    if (newStatus === RIDE_STATUSES.COMPLETED) {
      ride.completedAt = new Date().toISOString();
      RideSimulationService.stopSimulation();
    }

    db.set('activeRide', ride);

    // Broadcast live update to real-time subscribers
    emitRideEvent(ride.id, 'ride:status_changed', {
      rideId: ride.id,
      status: ride.status,
      telematics: ride.telematics,
      ride,
    });
    emitDriverTelemetry(ride.id, ride.telematics);

    console.log(`\x1b[32m[Simulation]\x1b[0m Ride ${ride.id} -> ${newStatus.toUpperCase()}`);
    return ride;
  }

  static advanceManual() {
    const ride = db.get('activeRide');
    if (!ride) return null;

    const currentIndex = RIDE_LIFECYCLE_STEPS.indexOf(ride.status);
    const nextIndex = Math.min(currentIndex + 1, RIDE_LIFECYCLE_STEPS.length - 1);
    const nextStatus = RIDE_LIFECYCLE_STEPS[nextIndex];

    return this.transitionStatus(ride, nextStatus);
  }

  static cancel() {
    this.stopSimulation();
    const ride = db.get('activeRide');
    if (ride) {
      ride.status = RIDE_STATUSES.CANCELLED;
      ride.cancelledAt = new Date().toISOString();

      // Record to ride history
      db.update('rides', (list) => [
        {
          id: ride.id,
          date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'Cancelled',
          category: ride.category,
          pickup: ride.pickup,
          destination: ride.destination,
          fare: 0,
          distance: (ride.distanceKm || 7.8) + ' km',
          duration: 'Cancelled by passenger',
          driver: ride.driver ? ride.driver.name : 'Unassigned',
          vehicle: ride.driver && ride.driver.vehicle ? ride.driver.vehicle.model : 'Standard Fleet',
          ratingGiven: null,
          paymentMethod: ride.paymentMethod || 'N/A',
        },
        ...list,
      ]);

      emitRideEvent(ride.id, 'ride:cancelled', { rideId: ride.id, ride });
    }

    db.set('activeRide', null);
    return true;
  }
}
