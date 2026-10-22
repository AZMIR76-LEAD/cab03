import { Capacitor } from '@capacitor/core';

// Resolve backend server origin dynamically:
const getServerBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (Capacitor.isNativePlatform()) {
    // On physical Android / emulator, localhost is phone loopback; 10.0.2.2 is host bridge
    return 'http://10.0.2.2:5000';
  }
  return '';
};

const API_BASE = `${getServerBase()}/api`;

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[RideX API] Error calling ${endpoint}:`, error.message);
    throw error;
  }
}

export const RideXAPI = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  sendOtp: (phone) => request('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),

  verifyOtp: (phone, otp, name = '', email = '') => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp, name, email }),
  }),

  // User Profile
  getProfile: () => request('/user/profile'),
  updateProfile: (profile) => request('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  }),

  // Rides & Pricing
  getFareEstimates: (distanceKm = 7.8, durationMin = 22) =>
    request(`/rides/estimate?distanceKm=${distanceKm}&durationMin=${durationMin}`),

  bookRide: (bookingData) => request('/rides/book', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),

  getActiveRide: () => request('/rides/active'),

  advanceSimulation: () => request('/rides/advance-simulation', {
    method: 'POST',
  }),

  cancelRide: () => request('/rides/cancel', {
    method: 'POST',
  }),

  rateRide: (rideId, ratingData) => request(`/rides/${rideId}/rate`, {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),

  getRideHistory: (status) => request(status ? `/rides/history?status=${status}` : '/rides/history'),

  getReceipt: (rideId) => request(`/rides/${rideId}/receipt`),

  // Drivers
  getNearbyDrivers: () => request('/drivers/nearby'),

  // Wallet
  getWallet: () => request('/wallet'),
  topupWallet: (amount) => request('/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
  addCard: (cardData) => request('/wallet/add-card', {
    method: 'POST',
    body: JSON.stringify(cardData),
  }),

  // Saved Places
  getSavedPlaces: () => request('/saved-places'),
  addSavedPlace: (place) => request('/saved-places', {
    method: 'POST',
    body: JSON.stringify(place),
  }),
  deleteSavedPlace: (id) => request(`/saved-places/${id}`, {
    method: 'DELETE',
  }),

  // Safety & SOS
  getEmergencyContacts: () => request('/safety/contacts'),
  addEmergencyContact: (contact) => request('/safety/contacts', {
    method: 'POST',
    body: JSON.stringify(contact),
  }),
  deleteEmergencyContact: (id) => request(`/safety/contacts/${id}`, {
    method: 'DELETE',
  }),
  triggerSOS: () => request('/safety/sos', {
    method: 'POST',
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/mark-read', {
    method: 'POST',
  }),
};
