// FG DRIVO Device Location Service
// Bridges Native Android GPS Sensor (@capacitor/geolocation) with React & Google Maps

import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

// Default fallback coordinate (Dindigul central hub, Tamil Nadu TN 57)
export const DEFAULT_FALLBACK_LOCATION = {
  latitude: 10.3673,
  longitude: 77.9803,
  address: 'Dindigul Central Hub, Tamil Nadu',
  isFallback: true,
};

let lastKnownPosition = null;

export const DeviceLocation = {
  /**
   * Request native Android runtime location permissions
   */
  async requestPermission() {
    try {
      if (Capacitor.isNativePlatform()) {
        const check = await Geolocation.checkPermissions();
        if (check.location === 'granted') {
          return true;
        }
        const request = await Geolocation.requestPermissions();
        return request.location === 'granted';
      }

      // Browser Web fallback
      if ('geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      }

      return false;
    } catch (err) {
      console.warn('[DeviceLocation] Permission error:', err.message);
      return false;
    }
  },

  /**
   * Get current device GPS fix with high accuracy
   */
  async getCurrentPosition(options = {}) {
    const opts = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options,
    };

    try {
      let position;
      if (Capacitor.isNativePlatform()) {
        position = await Geolocation.getCurrentPosition(opts);
      } else if ('geolocation' in navigator) {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, opts);
        });
      } else {
        throw new Error('Geolocation not supported on this platform');
      }

      const result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp || Date.now(),
        isFallback: false,
      };

      lastKnownPosition = result;
      return result;
    } catch (err) {
      console.warn('[DeviceLocation] Failed to get GPS fix, using fallback:', err.message);
      if (lastKnownPosition) {
        return { ...lastKnownPosition, isCached: true };
      }
      return DEFAULT_FALLBACK_LOCATION;
    }
  },

  /**
   * Watch location changes continuously (useful during active ride or pickup tuning)
   */
  async watchPosition(callback) {
    try {
      if (Capacitor.isNativePlatform()) {
        const watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 },
          (position, err) => {
            if (err) {
              console.warn('[DeviceLocation] Watch error:', err);
              return;
            }
            if (position) {
              const res = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp,
                isFallback: false,
              };
              lastKnownPosition = res;
              callback(res);
            }
          }
        );
        return () => Geolocation.clearWatch({ id: watchId });
      }

      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const res = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
              isFallback: false,
            };
            lastKnownPosition = res;
            callback(res);
          },
          (err) => console.warn('[DeviceLocation] Web watch error:', err),
          { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(id);
      }
    } catch (err) {
      console.warn('[DeviceLocation] Watch failed to initialize:', err.message);
      return () => {};
    }
  },

  /**
   * Reverse geocode coordinates to human-readable address string
   */
  async reverseGeocode(latitude, longitude) {
    // 1. If Google Maps JavaScript API is loaded in window
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat: latitude, lng: longitude },
        });
        if (response.results && response.results[0]) {
          return response.results[0].formatted_address;
        }
      } catch (err) {
        console.warn('[DeviceLocation] Google reverse geocoding failed:', err.message);
      }
    }

    // 2. OpenStreetMap Nominatim reverse geocode fallback
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FGDrivo-Android-App/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch {
      // ignore
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  },
};
