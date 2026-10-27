// FG DRIVO Real-time Telematics & Socket.IO Gateway Engine
import { Server } from 'socket.io';

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
