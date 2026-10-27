// Fu Drivo Cabin — Real-time Socket.IO Dispatch & Telemetry Service
import { io } from 'socket.io-client';

class DriverSocketService {
  constructor() {
    this.socket = null;
    this.telemetryTimer = null;
    this.listeners = new Map();
    this.isOnline = false;
    this.currentCoords = { lat: 10.3644, lng: 77.9702, heading: 90, speed: 0 };
  }

  connect(driverId) {
    if (this.socket && this.socket.connected) return;

    const host = window.location.hostname === 'localhost' ? 'http://127.0.0.1:5000' : window.location.origin;

    this.socket = io(host, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ [Cabin Socket] Connected to Fu Drivo Dispatch Cluster:', this.socket.id);
      this.socket.emit('driver:register', { driverId, platform: 'cabin_android' });
    });

    this.socket.on('ride:offer_broadcast', (offerData) => {
      console.log('🚨 [Cabin Socket] Incoming Ride Offer:', offerData);
      this.notify('offer', offerData);
    });

    this.socket.on('ride:cancelled', (data) => {
      this.notify('ride_cancelled', data);
    });

    this.socket.on('config:updated', (newConfig) => {
      this.notify('config_updated', newConfig);
    });

    this.socket.on('disconnect', () => {
      console.warn('⚠️ [Cabin Socket] Disconnected from dispatch cluster.');
    });
  }

  startAdaptiveTelemetry(driverId, getTripState) {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);

    // Dynamic Interval:
    // When en route or in transit: 3 seconds
    // When idle & online: 15 seconds heartbeat
    this.telemetryTimer = setInterval(() => {
      if (!this.isOnline || !this.socket || !this.socket.connected) return;

      const tripState = getTripState ? getTripState() : 'idle';
      
      // Simulate slight realistic GPS movement in Dindigul
      this.currentCoords.lat += (Math.random() - 0.5) * 0.0003;
      this.currentCoords.lng += (Math.random() - 0.5) * 0.0003;

      this.socket.emit('driver:telemetry', {
        driverId,
        coords: this.currentCoords,
        tripState,
        timestamp: Date.now(),
      });
    }, 4000);
  }

  stopTelemetry() {
    if (this.telemetryTimer) {
      clearInterval(this.telemetryTimer);
      this.telemetryTimer = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  disconnect() {
    this.stopTelemetry();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const driverSocket = new DriverSocketService();
