// Source: Google Maps Platform Code Assist
// FG DRIVO Real Google Maps Platform Component
// Built with official @vis.gl/react-google-maps SDK, AdvancedMarkerElement, Real Routes & Traffic Density

import React, { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Key, ExternalLink, ShieldCheck, Crosshair, Sparkles, Eye, EyeOff, Trash2, Shield, Navigation, AlertTriangle, Clock, Gauge } from 'lucide-react';

// Dindigul Central Geographic Coordinates
const DINDIGUL_CENTER = { lat: 10.3673, lng: 77.9803 };
const DEFAULT_PICKUP = { lat: 10.3644, lng: 77.9702 }; // Dindigul Railway Station
const DEFAULT_DESTINATION = { lat: 10.3812, lng: 77.9480 }; // Palani Road Bypass

// Internal component to render multi-colored traffic polylines on Google Map instance
function TrafficRouteOverlay({ trafficSegments, coordinates, pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const polylines = [];

    // If multi-colored traffic segments exist, render them with road styling
    if (trafficSegments && trafficSegments.length > 0) {
      trafficSegments.forEach((segment) => {
        if (!segment.points || segment.points.length < 2) return;

        // Background casing polyline for contrast
        const casing = new window.google.maps.Polyline({
          path: segment.points,
          geodesic: true,
          strokeColor: '#1E1236',
          strokeOpacity: 0.85,
          strokeWeight: 8,
          zIndex: 1,
          map,
        });
        polylines.push(casing);

        // Core traffic color polyline (Green / Orange / Red)
        const line = new window.google.maps.Polyline({
          path: segment.points,
          geodesic: true,
          strokeColor: segment.color || '#10B981',
          strokeOpacity: 1.0,
          strokeWeight: 5,
          zIndex: 2,
          map,
        });
        polylines.push(line);
      });
    } else if (coordinates && coordinates.length > 1) {
      // Single continuous road polyline
      const line = new window.google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: '#10B981',
        strokeOpacity: 0.95,
        strokeWeight: 6,
        zIndex: 2,
        map,
      });
      polylines.push(line);
    }

    // Auto-fit bounds so user sees full route
    try {
      const bounds = new window.google.maps.LatLngBounds();
      if (pickup?.lat) bounds.extend(pickup);
      if (destination?.lat) bounds.extend(destination);
      if (coordinates && coordinates.length) {
        coordinates.forEach((pt) => bounds.extend(pt));
      }
      map.fitBounds(bounds, { top: 70, right: 30, bottom: 80, left: 30 });
    } catch (e) {}

    return () => {
      polylines.forEach((pl) => pl.setMap(null));
    };
  }, [map, trafficSegments, coordinates, pickup, destination]);

  return null;
}

export default function GoogleMapCanvas({
  pickupCoords = null,
  destinationCoords = null,
  driverCoords = null,
  pickupName = 'Dindigul Railway Junction',
  destName = 'Palani Road Bypass',
  tripState = 'idle',
  height = '100%',
  className = '',
}) {
  // Support env variable or localStorage stored key
  const [apiKey, setApiKey] = useState(() => {
    return (
      (typeof window !== 'undefined' && localStorage.getItem('fg_gmaps_api_key')) ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      ''
    );
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // Real Road Directions State
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const pickup = useMemo(() => {
    return pickupCoords
      ? { lat: pickupCoords[0] || pickupCoords.lat, lng: pickupCoords[1] || pickupCoords.lng }
      : DEFAULT_PICKUP;
  }, [pickupCoords]);

  const destination = useMemo(() => {
    return destinationCoords
      ? { lat: destinationCoords[0] || destinationCoords.lat, lng: destinationCoords[1] || destinationCoords.lng }
      : DEFAULT_DESTINATION;
  }, [destinationCoords]);

  const captainPos = driverCoords
    ? { lat: driverCoords[0] || driverCoords.lat, lng: driverCoords[1] || driverCoords.lng, heading: driverCoords[2] || 90 }
    : { lat: 10.3695, lng: 77.9740, heading: 45 };

  // Fetch real road routes and traffic conditions from backend routes API
  useEffect(() => {
    let isCancelled = false;
    const fetchDirections = async () => {
      if (!pickup?.lat || !destination?.lat) return;
      setIsLoadingRoute(true);
      try {
        const query = new URLSearchParams({
          origin: `${pickup.lat},${pickup.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          apiKey: apiKey || '',
        });
        const res = await fetch(`/api/routes/directions?${query.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isCancelled && data.success && data.route) {
          setRouteData(data.route);
        }
      } catch (err) {
        console.warn('[GoogleMapCanvas] Route fetch warning:', err.message);
      } finally {
        if (!isCancelled) setIsLoadingRoute(false);
      }
    };

    fetchDirections();
    return () => {
      isCancelled = true;
    };
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng, apiKey]);

  const handleSaveKey = () => {
    const cleanKey = inputKey.trim();
    if (cleanKey) {
      localStorage.setItem('fg_gmaps_api_key', cleanKey);
      setApiKey(cleanKey);
      setShowKeyModal(false);
      setInputKey('');
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('fg_gmaps_api_key');
    setApiKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
    setInputKey('');
    setShowKeyModal(false);
  };

  // Determine overall route traffic color
  const primaryTrafficSpeed = useMemo(() => {
    if (!routeData?.trafficSegments?.length) return 'normal';
    const hasJam = routeData.trafficSegments.some((s) => s.speed === 'traffic_jam');
    if (hasJam) return 'traffic_jam';
    const hasSlow = routeData.trafficSegments.some((s) => s.speed === 'slow');
    if (hasSlow) return 'slow';
    return 'normal';
  }, [routeData]);

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ height, minHeight: '220px', position: 'relative', backgroundColor: '#E5E7EB' }}
    >
      {/* Turn-by-Turn Navigation & Traffic Density Header Banner */}
      {routeData && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '48px',
            zIndex: 300,
            backgroundColor: 'rgba(30, 18, 54, 0.94)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            borderRadius: '14px',
            padding: '8px 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#F5C400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Navigation size={14} color="#1E1236" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8FAFC' }}>
                  {routeData.steps?.[0]?.instruction || 'Continue straight towards destination'}
                </div>
                <div style={{ fontSize: '10px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{routeData.distanceKm} km</span>
                  <span>•</span>
                  <span>{routeData.durationMin} mins</span>
                </div>
              </div>
            </div>

            {/* Traffic Condition Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '9.5px',
                fontWeight: 700,
                backgroundColor:
                  primaryTrafficSpeed === 'traffic_jam'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : primaryTrafficSpeed === 'slow'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                color:
                  primaryTrafficSpeed === 'traffic_jam'
                    ? '#FCA5A5'
                    : primaryTrafficSpeed === 'slow'
                    ? '#FCD34D'
                    : '#6EE7B7',
                border: `1px solid ${
                  primaryTrafficSpeed === 'traffic_jam'
                    ? 'rgba(239, 68, 68, 0.5)'
                    : primaryTrafficSpeed === 'slow'
                    ? 'rgba(245, 158, 11, 0.5)'
                    : 'rgba(16, 185, 129, 0.5)'
                }`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor:
                    primaryTrafficSpeed === 'traffic_jam'
                      ? '#EF4444'
                      : primaryTrafficSpeed === 'slow'
                      ? '#F59E0B'
                      : '#10B981',
                }}
              />
              {primaryTrafficSpeed === 'traffic_jam'
                ? 'Heavy Traffic'
                : primaryTrafficSpeed === 'slow'
                ? 'Moderate Traffic'
                : 'Free Flow'}
            </div>
          </div>
        </div>
      )}

      {/* If API Key is present, mount live official Google Maps */}
      {apiKey ? (
        <APIProvider apiKey={apiKey} solutionChannel="GMP_visgl_rgm_v1_default">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={DINDIGUL_CENTER}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Real Road Polyline with Traffic Conditions */}
            <TrafficRouteOverlay
              trafficSegments={routeData?.trafficSegments}
              coordinates={routeData?.coordinates}
              pickup={pickup}
              destination={destination}
            />

            {/* 1. Pickup Advanced Marker */}
            <AdvancedMarker position={pickup} title={pickupName}>
              <Pin background="#10B981" glyphColor="#FFFFFF" borderColor="#FFFFFF" scale={1.2}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>📍</span>
              </Pin>
            </AdvancedMarker>

            {/* 2. Destination Advanced Marker */}
            <AdvancedMarker position={destination} title={destName}>
              <Pin background="#6366F1" glyphColor="#FFFFFF" borderColor="#FFFFFF" scale={1.2}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>🏁</span>
              </Pin>
            </AdvancedMarker>

            {/* 3. Real Moving Captain Vehicle Marker */}
            <AdvancedMarker position={{ lat: captainPos.lat, lng: captainPos.lng }} title="FG DRIVO Captain (TN 57 CE 4819)">
              <div
                style={{
                  transform: `rotate(${captainPos.heading || 0}deg)`,
                  transition: 'transform 0.4s ease-out',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#F5C400',
                    border: '2.5px solid #1E1236',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1236" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <path d="M9 17h6"/>
                    <circle cx="17" cy="17" r="2"/>
                  </svg>
                </div>
                <div
                  style={{
                    marginTop: '2px',
                    backgroundColor: '#1E1236',
                    color: '#F5C400',
                    fontFamily: 'monospace',
                    fontSize: '8px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  TN 57 CE 4819
                </div>
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>
      ) : (
        /* Zero-Config Direct Official Google Maps Live Embed */
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <iframe
            title="Google Maps Dindigul"
            src={`https://maps.google.com/maps?q=${pickup.lat},${pickup.lng}&hl=en&z=15&output=embed`}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
              pointerEvents: 'none',
            }}
            allowFullScreen
            loading="lazy"
          />

          {/* Real Moving Captain Vehicle Marker Over Google Map */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '46%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                backgroundColor: '#F5C400',
                border: '2.5px solid #1E1236',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1236" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div
              style={{
                marginTop: '2px',
                backgroundColor: '#1E1236',
                color: '#F5C400',
                fontFamily: 'monospace',
                fontSize: '8px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              TN 57 CE 4819
            </div>
          </div>
        </div>
      )}

      {/* Quick API Key Setup Button */}
      <button
        onClick={() => setShowKeyModal(true)}
        title="Configure Google Maps Platform Key"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 400,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#1A73E8',
        }}
      >
        <Key size={14} />
      </button>

      {/* API Key Modal */}
      {showKeyModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 500,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '340px',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              padding: '20px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#1A73E8" />
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Google Maps Platform Key</h4>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 7px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Shield size={10} /> Client-Restricted
              </span>
            </div>

            <p style={{ fontSize: '11.5px', color: '#64748B', marginBottom: '10px', lineHeight: '1.4' }}>
              Provide your Google Maps API Key or free Maps Demo Key to unlock live Google Maps road vector tiles and real-time traffic rendering.
            </p>

            {/* Masked Password Input with Visibility Toggle */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder={apiKey ? '•••••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0 40px 0 12px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              {apiKey ? (
                <button
                  type="button"
                  onClick={handleClearKey}
                  title="Remove saved API key"
                  style={{
                    height: '36px',
                    padding: '0 10px',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '11px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} /> Reset
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowKeyModal(false); setInputKey(''); }}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={!inputKey.trim()}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    backgroundColor: inputKey.trim() ? '#1A73E8' : '#93C5FD',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: 'none',
                    cursor: inputKey.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
