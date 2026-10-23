// FG DRIVO Captain Fleet Cockpit (Driver App Home)
import React, { useState, useEffect, useRef } from 'react';
import {
  Car, Power, Navigation, Shield, Award, Phone, Clock,
  ArrowRight, User, TrendingUp, AlertCircle, Compass, RefreshCw, LogOut, Check
} from 'lucide-react';
import { RideXAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { sounds } from '../../utils/soundEffects';
import IncomingRideRadar from '../../components/driver/IncomingRideRadar';
import DriverActiveTrip from './DriverActiveTrip';

export default function DriverCockpit({ onNavigateToPassenger }) {
  const [driver, setDriver] = useState({
    id: 'DRV-8821',
    name: 'Arjun Verma',
    phone: '+91 98112 34567',
    rating: 4.92,
    tripsCount: 2420,
    earningsToday: 1240.0,
    vehicle: {
      model: 'Honda City',
      licensePlate: 'TN 57 CE 4819',
      color: 'Midnight Black',
      category: 'Sedan',
    },
    coords: { x: 48, y: 62 },
  });

  const [isOnline, setIsOnline] = useState(true);
  const [incomingTrip, setIncomingTrip] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [gpsLocation, setGpsLocation] = useState({ lat: 10.3644, lng: 77.9702 });
  const [gpsStatus, setGpsStatus] = useState('Acquiring GPS...');
  const watchIdRef = useRef(null);

  // 1. Initial Load & Driver Auth
  useEffect(() => {
    // Authenticate / sync driver details
    RideXAPI.authDriver({
      phone: '+91 98112 34567',
      name: 'Arjun Verma',
      vehicleModel: 'Honda City Sedan',
      licensePlate: 'TN 57 CE 4819',
      vehicleCategory: 'sedan',
    })
      .then((res) => {
        if (res && res.driver) {
          setDriver((prev) => ({ ...prev, ...res.driver }));
        }
      })
      .catch((err) => console.warn('Driver auth fallback:', err.message));

    // Check if there is an existing active trip
    RideXAPI.getDriverActiveTrip()
      .then((res) => {
        if (res && res.hasActiveTrip && res.ride) {
          setActiveTrip(res.ride);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Online / Offline Duty Management & GPS Watcher
  useEffect(() => {
    if (isOnline) {
      // Connect to Socket.IO and join driver dispatch room
      socketService.joinDriver(driver.id, driver.coords);
      setGpsStatus('GPS Active • Online');

      // HTML5 Geolocation API watcher
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setGpsLocation({ lat, lng });
            setGpsStatus('GPS High Accuracy Lock');

            // Emit live telemetry to server & passenger maps
            socketService.emitDriverTelemetry({
              driverId: driver.id,
              rideId: activeTrip?.id || null,
              lat,
              lng,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
            });
          },
          (err) => {
            console.warn('[Driver GPS] Notice:', err.message);
            setGpsStatus('GPS Active (City Grid Lock)');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
        );
      }

      // Also register 3-second heartbeat to guarantee live movement on map
      const heartbeat = setInterval(() => {
        socketService.emitDriverTelemetry({
          driverId: driver.id,
          rideId: activeTrip?.id || null,
          coords: driver.coords,
          heading: 135,
        });
      }, 3000);

      return () => {
        clearInterval(heartbeat);
        if (watchIdRef.current && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    } else {
      socketService.leaveDriver(driver.id);
      setGpsStatus('Offline');
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    }
  }, [isOnline, driver.id, driver.coords, activeTrip]);

  // 3. Listen for Incoming Ride Requests from Passenger App
  useEffect(() => {
    const unsub = socketService.on('driver:incoming_trip', (trip) => {
      if (!isOnline || activeTrip) return;
      console.log('[Driver Cockpit] Received incoming ride request:', trip);
      setIncomingTrip(trip);
    });

    return () => unsub();
  }, [isOnline, activeTrip]);

  // Handle Online / Offline toggle
  const toggleDuty = async () => {
    sounds.playTick();
    const nextState = !isOnline;
    setIsOnline(nextState);
    try {
      await RideXAPI.toggleDriverOnline(driver.id, nextState, driver.coords);
    } catch (e) {}
  };

  // Handle Radar Accept
  const handleAcceptRide = async (trip) => {
    setIncomingTrip(null);
    sounds.playTick();
    try {
      await RideXAPI.acceptTrip(driver.id, trip.rideId);
      socketService.acceptTrip({ driverId: driver.id, rideId: trip.rideId });
      setActiveTrip({
        ...trip,
        id: trip.rideId,
        status: 'driver_assigned',
      });
    } catch (err) {
      console.warn('Accept trip API error:', err.message);
      setActiveTrip({
        ...trip,
        id: trip.rideId,
        status: 'driver_assigned',
      });
    }
  };

  // Handle Radar Decline / Timeout
  const handleDeclineRide = async () => {
    if (incomingTrip) {
      RideXAPI.rejectTrip(driver.id, incomingTrip.rideId).catch(() => {});
    }
    setIncomingTrip(null);
  };

  // Test Simulator: Triggers 15-second Radar Alert instantly for testing
  const triggerTestRideRadar = () => {
    sounds.playTick();
    setIncomingTrip({
      rideId: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'FG DRIVO Sedan',
      fare: 198.00,
      pickup: 'Dindigul Railway Junction (Main Gate)',
      destination: 'Palani Road Bypass, Near Velu Vidyalaya',
      distanceKm: '5.2',
      durationMin: '16',
      paymentMethod: 'pm-cash',
      timerSec: 15,
      riderName: 'Ashfar Khan',
      riderPhone: '+91 99988 87771',
    });
  };

  // If executing an active trip, render DriverActiveTrip
  if (activeTrip) {
    return (
      <DriverActiveTrip
        ride={activeTrip}
        driver={driver}
        onTripFinished={() => {
          setActiveTrip(null);
          setDriver((prev) => ({
            ...prev,
            earningsToday: prev.earningsToday + (activeTrip.fare || 198),
            tripsCount: prev.tripsCount + 1,
          }));
        }}
      />
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        position: 'relative',
        minHeight: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* 15-Second Incoming Ride Radar Modal */}
      {incomingTrip && (
        <IncomingRideRadar
          trip={incomingTrip}
          onAccept={handleAcceptRide}
          onDecline={handleDeclineRide}
        />
      )}

      {/* ----------------- CAPTAIN HEADER ----------------- */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#5427A8',
              border: '2px solid #8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 900,
              color: '#FFFFFF',
            }}
          >
            {driver.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#F8FAFC' }}>{driver.name}</span>
              <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#F5C400', color: '#1E1B4B', padding: '2px 6px', borderRadius: '4px' }}>
                CAPTAIN
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '1px' }}>
              {driver.vehicle.model} • <strong style={{ color: '#E2E8F0' }}>{driver.vehicle.licensePlate}</strong>
            </div>
          </div>
        </div>

        {/* Switch to Passenger App Button */}
        {onNavigateToPassenger && (
          <button
            onClick={() => {
              sounds.playTick();
              onNavigateToPassenger();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#334155',
              color: '#F8FAFC',
              border: '1px solid #475569',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={14} />
            <span>Passenger Mode</span>
          </button>
        )}
      </div>

      {/* ----------------- DUTY TOGGLE BANNER ----------------- */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div
          onClick={toggleDuty}
          style={{
            backgroundColor: isOnline ? '#10B981' : '#334155',
            borderRadius: '20px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: isOnline ? '0 8px 24px rgba(16, 185, 129, 0.35)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: isOnline ? '#10B981' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Power size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF' }}>
                {isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
              </div>
              <div style={{ fontSize: '12px', color: isOnline ? '#D1FAE5' : '#94A3B8' }}>
                {isOnline ? 'Ready to accept incoming trip requests' : 'Tap to go online & start receiving rides'}
              </div>
            </div>
          </div>

          <div
            style={{
              width: '56px',
              height: '32px',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOnline ? 'flex-end' : 'flex-start',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: isOnline ? '#10B981' : '#94A3B8' }} />
          </div>
        </div>
      </div>

      {/* ----------------- DAILY STATS CARDS ----------------- */}
      <div style={{ padding: '8px 20px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {/* Earnings */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '14px 12px', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>TODAY</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
            ₹{Number(driver.earningsToday || 1240).toFixed(0)}
          </div>
        </div>

        {/* Trips */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '14px 12px', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>TRIPS</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#F8FAFC', marginTop: '2px' }}>
            {driver.tripsCount || 6}
          </div>
        </div>

        {/* Rating */}
        <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '14px 12px', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>RATING</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#F5C400', marginTop: '2px' }}>
            {driver.rating || 4.92} ★
          </div>
        </div>
      </div>

      {/* ----------------- RADAR & MAP CANVAS ----------------- */}
      <div
        style={{
          flex: 1,
          margin: '0 20px 14px',
          backgroundColor: '#1E293B',
          borderRadius: '22px',
          border: '1.5px solid #334155',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* GPS Indicator Banner */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#0F172A',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOnline ? '#10B981' : '#64748B' }} />
            <span>{gpsStatus}</span>
          </div>
          <span style={{ color: '#64748B' }}>Dindigul Zone (TN 57)</span>
        </div>

        {/* Center Radar Graphic */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {isOnline ? (
            <>
              {/* Pulsing Radar Circle */}
              <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid rgba(16, 185, 129, 0.4)',
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Car size={42} color="#10B981" />
                </div>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 900, color: '#F8FAFC', marginBottom: '4px' }}>
                Searching for Trips Nearby...
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', maxWidth: '260px', margin: 0 }}>
                Keep app open. When a passenger books in Dindigul, the 15-second radar alert will chime.
              </p>
            </>
          ) : (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', color: '#94A3B8' }}>
                <Power size={32} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#F8FAFC', marginBottom: '4px' }}>
                You are currently Offline
              </div>
              <p style={{ fontSize: '12.5px', color: '#94A3B8', maxWidth: '240px', margin: '0 0 16px' }}>
                Toggle duty status to Online above to receive rides.
              </p>
              <button
                onClick={toggleDuty}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Go Online Now
              </button>
            </>
          )}
        </div>
      </div>

      {/* ----------------- BOTTOM SIMULATOR TEST BAR ----------------- */}
      <div style={{ padding: '0 20px 18px' }}>
        <button
          onClick={triggerTestRideRadar}
          style={{
            width: '100%',
            height: '46px',
            backgroundColor: '#2E1065',
            color: '#DDD6FE',
            border: '1.5px dashed #7C3AED',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚡ Test 15-Second Ride Radar Alert</span>
        </button>
      </div>
    </div>
  );
}
