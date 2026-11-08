// FG DRIVO Real-time Telematics & Socket.IO Gateway Engine
import { Server } from 'socket.io';
import { db } from '../db.js';

let ioInstance = null;

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

    // Join ride-specific room for targeted live updates
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

    // Driver companion registration
    socket.on('driver:register', (data) => {
      socket.join('drivers');
      socket.driverData = data;
      const drivers = db.get('drivers') || [];
      const cleanPhone = (data?.phone || '').replace(/\D/g, '').slice(-10);
      const driverId = data?.driverId || `DRV-${cleanPhone.slice(-4) || '8821'}`;

      const driverProfile = {
        id: driverId,
        name: data?.name || 'Driver Partner',
        phone: data?.phone || '+91 98765 43210',
        rating: Number(data?.rating) || 4.88,
        tripsCount: 150,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        vehicle: {
          model: data?.vehicleType || 'SUV',
          category: (data?.vehicleType || 'suv').toLowerCase(),
          licensePlate: data?.vehicleNumber || 'TN 57',
        },
        coords: data?.coords || { lat: 10.3673, lng: 77.9803 },
        isOnline: true,
        socketId: socket.id,
      };

      const existingIdx = drivers.findIndex((d) => d.id === driverId || d.phone === data?.phone);
      if (existingIdx >= 0) {
        drivers[existingIdx] = { ...drivers[existingIdx], ...driverProfile };
      } else {
        drivers.push(driverProfile);
      }
      db.set('drivers', drivers);
      console.log(`\x1b[32m[Socket.IO]\x1b[0m Driver ${driverProfile.name} (${driverProfile.vehicle.model} • ${driverProfile.vehicle.licensePlate}) registered in dispatch pool.`);
    });

    // Driver live telematics forwarding to passenger
    socket.on('driver:telemetry', (data) => {
      const activeRide = db.get('activeRide');
      if (activeRide && data?.coords) {
        activeRide.telematics = {
          ...activeRide.telematics,
          driverCoords: data.coords,
          heading: data.coords.heading || 90,
          speed: data.coords.speed || 35,
          lastUpdated: new Date().toISOString(),
        };
        emitDriverTelemetry(activeRide.id, activeRide.telematics);
      }
    });

    socket.on('disconnect', (reason) => {
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
  // Broadcast to room if rideId present, and also emit globally for dashboard listeners
  if (rideId) {
    ioInstance.to(`ride:${rideId}`).emit(eventName, data);
  }
  ioInstance.emit(eventName, data);
}

export function emitDriverTelemetry(rideId, telemetry) {
  if (!ioInstance) return;
  emitRideEvent(rideId, 'driver:telematics', telemetry);
}

export function broadcastRideOffer(offerData) {
  if (!ioInstance) return;
  ioInstance.to('drivers').emit('ride:offer_broadcast', offerData);
  ioInstance.emit('ride:offer_broadcast', offerData);
}
