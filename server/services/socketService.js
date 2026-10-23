// FG DRIVO Real-time Telematics & Socket.IO Gateway Engine
import { Server } from 'socket.io';
import { db } from '../db.js';
import { RIDE_STATUSES } from '../config/constants.js';
import { RideSimulationService } from './rideSimulationService.js';

let ioInstance = null;
const onlineDriversMap = new Map(); // driverId -> Set of socket IDs

export function initSocketServer(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    console.log(`\x1b[36m[Socket.IO]\x1b[0m Client connected: ${socket.id}`);

    // Passenger / Dashboard room subscription
    socket.on('ride:subscribe', (rideId) => {
      if (rideId) {
        socket.join(`ride:${rideId}`);
        console.log(`\x1b[36m[Socket.IO]\x1b[0m ${socket.id} subscribed to room ride:${rideId}`);
      }
    });

    socket.on('ride:unsubscribe', (rideId) => {
      if (rideId) {
        socket.leave(`ride:${rideId}`);
        console.log(`\x1b[36m[Socket.IO]\x1b[0m ${socket.id} unsubscribed from room ride:${rideId}`);
      }
    });

    // -------------------------------------------------------------
    // DRIVER COCKPIT REAL-TIME EVENTS
    // -------------------------------------------------------------

    // Driver goes online and joins dispatch pool
    socket.on('driver:join', (data) => {
      const driverId = typeof data === 'string' ? data : data?.driverId;
      if (!driverId) return;

      socket.join('drivers_online');
      socket.join(`driver:${driverId}`);

      if (!onlineDriversMap.has(driverId)) {
        onlineDriversMap.set(driverId, new Set());
      }
      onlineDriversMap.get(driverId).add(socket.id);

      console.log(`\x1b[32m[Socket.IO Driver]\x1b[0m Captain ${driverId} connected & online (Socket: ${socket.id})`);

      // Update in-memory driver status
      const drivers = db.get('drivers') || [];
      const d = drivers.find((x) => x.id === driverId);
      if (d) {
        d.isOnline = true;
        d.status = 'available';
        if (data?.coords) {
          d.coords = data.coords;
        }
      }
    });

    // Driver goes offline
    socket.on('driver:leave', (driverId) => {
      if (!driverId) return;
      socket.leave('drivers_online');
      socket.leave(`driver:${driverId}`);

      if (onlineDriversMap.has(driverId)) {
        onlineDriversMap.get(driverId).delete(socket.id);
        if (onlineDriversMap.get(driverId).size === 0) {
          onlineDriversMap.delete(driverId);
        }
      }

      console.log(`\x1b[33m[Socket.IO Driver]\x1b[0m Captain ${driverId} went offline`);
      const drivers = db.get('drivers') || [];
      const d = drivers.find((x) => x.id === driverId);
      if (d) {
        d.isOnline = false;
        d.status = 'offline';
      }
    });

    // Live GPS telemetry from Driver's phone
    socket.on('driver:telemetry', (payload) => {
      if (!payload || !payload.driverId) return;
      const { driverId, rideId, lat, lng, coords, heading, speed } = payload;

      const drivers = db.get('drivers') || [];
      const d = drivers.find((x) => x.id === driverId);
      if (d) {
        if (coords) d.coords = coords;
        else if (lat !== undefined && lng !== undefined) {
          d.coords = { x: lng, y: lat };
        }
        if (heading !== undefined) d.heading = heading;
      }

      // If driver is currently executing an active ride, stream coordinates directly to customer
      if (rideId) {
        const activeRide = db.get('activeRide');
        if (activeRide && activeRide.id === rideId) {
          activeRide.telematics = {
            ...activeRide.telematics,
            driverCoords: d?.coords || coords || { x: lng, y: lat },
            heading: heading || activeRide.telematics?.heading || 0,
            lastUpdated: new Date().toISOString(),
          };
          emitDriverTelemetry(rideId, activeRide.telematics);
        }
      }

      // Also broadcast nearby location updates
      ioInstance.emit('driver:location_update', {
        driverId,
        coords: d?.coords || coords,
        heading,
        speed,
      });
    });

    // Driver accepts incoming trip from Radar modal
    socket.on('driver:accept', (payload) => {
      if (!payload || !payload.rideId || !payload.driverId) return;
      const { rideId, driverId } = payload;

      const activeRide = db.get('activeRide');
      if (!activeRide || activeRide.id !== rideId) return;

      // Stop automated bot simulation since a real driver accepted
      RideSimulationService.stopSimulation();

      const drivers = db.get('drivers') || [];
      const assignedDriver = drivers.find((d) => d.id === driverId) || activeRide.driver;

      activeRide.status = RIDE_STATUSES.DRIVER_ASSIGNED;
      activeRide.driver = {
        ...assignedDriver,
        id: driverId,
        isRealDriver: true,
      };

      console.log(`\x1b[32m[Socket.IO Dispatch]\x1b[0m Trip ${rideId} claimed by Real Captain: ${assignedDriver.name}`);

      // Alert both rider and captain
      emitRideEvent(rideId, 'ride:status_update', {
        status: RIDE_STATUSES.DRIVER_ASSIGNED,
        ride: activeRide,
        driver: assignedDriver,
      });

      ioInstance.to(`driver:${driverId}`).emit('trip:accepted_confirmation', {
        success: true,
        ride: activeRide,
      });
    });

    // Driver marks arrival at pickup point
    socket.on('driver:arrived', (payload) => {
      const rideId = payload?.rideId;
      const activeRide = db.get('activeRide');
      if (activeRide && activeRide.id === rideId) {
        activeRide.status = RIDE_STATUSES.DRIVER_ARRIVED;
        emitRideEvent(rideId, 'ride:status_update', {
          status: RIDE_STATUSES.DRIVER_ARRIVED,
          ride: activeRide,
          message: 'Your captain has arrived at the pickup location!',
        });
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', (reason) => {
      for (const [driverId, sockSet] of onlineDriversMap.entries()) {
        if (sockSet.has(socket.id)) {
          sockSet.delete(socket.id);
          if (sockSet.size === 0) {
            onlineDriversMap.delete(driverId);
            const drivers = db.get('drivers') || [];
            const d = drivers.find((x) => x.id === driverId);
            if (d) d.isOnline = false;
          }
        }
      }
      console.log(`\x1b[36m[Socket.IO]\x1b[0m Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function emitRideEvent(rideId, eventName, data) {
  if (!ioInstance) return;
  if (rideId) {
    ioInstance.to(`ride:${rideId}`).emit(eventName, data);
  }
  ioInstance.emit(eventName, data);
}

export function emitDriverTelemetry(rideId, telemetry) {
  if (!ioInstance) return;
  emitRideEvent(rideId, 'driver:telematics', telemetry);
}

// Broadcast incoming ride request to all connected online captains (15s radar)
export function broadcastIncomingTripToDrivers(ride) {
  if (!ioInstance || !ride) return;

  const tripPayload = {
    rideId: ride.id,
    pickup: ride.pickup,
    destination: ride.destination,
    pickupCoords: ride.pickupCoords,
    destinationCoords: ride.destinationCoords,
    fare: ride.fare,
    category: ride.category,
    distanceKm: ride.distanceKm,
    durationMin: ride.durationMin,
    paymentMethod: ride.paymentMethod,
    timerSec: 15,
    timestamp: new Date().toISOString(),
  };

  console.log(`\x1b[35m[Dispatch Radar]\x1b[0m Broadcasting incoming trip ${ride.id} to room 'drivers_online' (15s timer)`);
  ioInstance.to('drivers_online').emit('driver:incoming_trip', tripPayload);
  ioInstance.emit('driver:incoming_trip', tripPayload);
}

export function getOnlineDriversCount() {
  return onlineDriversMap.size;
}
