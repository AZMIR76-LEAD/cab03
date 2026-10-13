// FG DRIVO Real-time WebSocket Client Engine
// Connects React Client with Express/Socket.IO Backend Engine

import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:5000';
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : window.location.origin;
};

const SOCKET_URL = getSocketUrl();

class SocketClient {
  constructor() {
    this.socket = null;
    this.currentRideId = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`%c[FG DRIVO Socket]%c Connected to real-time engine: ${this.socket.id}`, 'color: #10B981; font-weight: bold;', 'color: inherit;');

      if (this.currentRideId) {
        this.subscribeToRide(this.currentRideId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`%c[FG DRIVO Socket]%c Disconnected: ${reason}`, 'color: #F59E0B; font-weight: bold;', 'color: inherit;');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[FG DRIVO Socket] Connection warning:', error.message);
    });

    // Wire global handlers
    this.socket.on('ride:status_changed', (payload) => {
      this.notifyListeners('ride:status_changed', payload);
    });

    this.socket.on('driver:telematics', (payload) => {
      this.notifyListeners('driver:telematics', payload);
    });

    this.socket.on('safety:sos_alert', (payload) => {
      this.notifyListeners('safety:sos_alert', payload);
    });

    this.socket.on('ride:cancelled', (payload) => {
      this.notifyListeners('ride:cancelled', payload);
    });

    return this.socket;
  }

  subscribeToRide(rideId) {
    if (!rideId) return;
    this.currentRideId = rideId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('ride:subscribe', rideId);
      console.log(`[FG DRIVO Socket] Subscribed to room ride:${rideId}`);
    }
  }

  unsubscribeFromRide(rideId) {
    const id = rideId || this.currentRideId;
    if (id && this.socket && this.socket.connected) {
      this.socket.emit('ride:unsubscribe', id);
    }
    if (this.currentRideId === id) {
      this.currentRideId = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Auto-connect if listener registered
    if (!this.socket) {
      this.connect();
    }

    // Return unbind function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[FG DRIVO Socket] Listener error for ${event}:`, err);
        }
      });
    }
  }
}

export const socketService = new SocketClient();
