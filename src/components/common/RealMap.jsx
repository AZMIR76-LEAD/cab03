// FG DRIVO Real World Interactive Map Component
// Powered by Leaflet & High-Precision Dindigul CartoDB Tiles

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Plus, Minus, Compass, Layers, Crosshair } from 'lucide-react';

// Dindigul Regional Geographic Coordinates
export const DINDIGUL_GEO = {
  center: [10.3673, 77.9803],
  pickupDefault: [10.3644, 77.9702], // Dindigul Railway Station
  destDefault: [10.3812, 77.9480],   // Palani Road Bypass
  nearbyCaptains: [
    { id: 1, lat: 10.3695, lng: 77.9740, heading: 45, plate: 'TN 57 CE 4819' },
    { id: 2, lat: 10.3610, lng: 77.9650, heading: 120, plate: 'TN 57 MJ 3321' },
    { id: 3, lat: 10.3730, lng: 77.9600, heading: 210, plate: 'TN 57 AB 8912' },
    { id: 4, lat: 10.3580, lng: 77.9780, heading: 90, plate: 'TN 57 EQ 7780' },
  ],
};

// Custom Leaflet HTML Pin Generators
function createPinIcon(type, label = '') {
  const isPickup = type === 'pickup';
  const color = isPickup ? '#10B981' : '#6366F1';
  const glow = isPickup ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 15px ${glow}, 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 13px;
      ">
        ${isPickup ? '📍' : '🏁'}
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background-color: ${color};
        transform: rotate(45deg);
        margin-top: -4px;
      "></div>
      ${label ? `
        <div style="
          margin-top: 4px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        ">${label}</div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'fg-drivo-custom-pin',
    iconSize: [34, 46],
    iconAnchor: [17, 36],
  });
}

function createCarIcon(heading = 0, isAssigned = true, plate = '') {
  const bgColor = isAssigned ? '#F5C400' : '#E2E8F0';
  const iconHtml = `
    <div style="
      position: relative;
      transform: rotate(${heading}deg);
      transition: transform 0.4s ease-out;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        width: 32px;
        height: 32px;
        background: ${bgColor};
        border: 2px solid #1E1236;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 12px rgba(0,0,0,0.35);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1236" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
      ${plate ? `
        <div style="
          margin-top: 2px;
          background: #1E1236;
          color: #F5C400;
          font-family: monospace;
          font-size: 8px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 3px;
          letter-spacing: 0.5px;
        ">${plate}</div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'fg-drivo-car-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function RealMap({
  pickupCoords = null,       // [lat, lng] or null
  destinationCoords = null,  // [lat, lng] or null
  driverCoords = null,       // [lat, lng, heading] or null
  pickupName = 'Dindigul Junction',
  destName = 'Palani Road Bypass',
  tripState = 'idle',        // idle, arriving, in_progress, completed
  height = '100%',
  interactive = true,
  onLocationSelect = null,
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({ pickup: null, dest: null, driver: null, nearby: [] });
  const polylineRef = useRef(null);

  const [mapStyle, setMapStyle] = useState('voyager'); // 'voyager' | 'dark'

  // Default coordinate resolutions
  const pickup = pickupCoords || DINDIGUL_GEO.pickupDefault;
  const destination = destinationCoords || DINDIGUL_GEO.destDefault;

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DINDIGUL_GEO.center,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager Real Tiles (Ultra clean, Google Maps style aesthetic)
      const tileUrl = mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click callback
      if (onLocationSelect) {
        map.on('click', (e) => {
          onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Tile style updater
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileUrl = mapStyle === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
  }, [mapStyle]);

  // 3. Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. Pickup Marker
    if (markersRef.current.pickup) map.removeLayer(markersRef.current.pickup);
    markersRef.current.pickup = L.marker(pickup, {
      icon: createPinIcon('pickup', pickupName),
    }).addTo(map);

    // B. Destination Marker
    if (markersRef.current.dest) map.removeLayer(markersRef.current.dest);
    markersRef.current.dest = L.marker(destination, {
      icon: createPinIcon('dest', destName),
    }).addTo(map);

    // C. Route Polyline
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    const routePoints = [
      pickup,
      // Realistic intermediate waypoint through Dindigul Clock Tower Circle
      [(pickup[0] + destination[0]) / 2 + 0.003, (pickup[1] + destination[1]) / 2 - 0.004],
      destination,
    ];

    polylineRef.current = L.polyline(routePoints, {
      color: '#4F46E5',
      weight: 5,
      opacity: 0.85,
      smoothFactor: 1,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: tripState === 'in_progress' ? null : '8, 8',
    }).addTo(map);

    // D. Moving Captain Driver Marker
    if (markersRef.current.driver) map.removeLayer(markersRef.current.driver);

    let currentDriverPos = driverCoords;
    if (!currentDriverPos) {
      if (tripState === 'arriving') {
        currentDriverPos = [pickup[0] + 0.006, pickup[1] - 0.005, 135];
      } else if (tripState === 'in_progress') {
        currentDriverPos = [routePoints[1][0], routePoints[1][1], 80];
      } else if (tripState === 'arrived') {
        currentDriverPos = [pickup[0] + 0.0003, pickup[1] + 0.0002, 90];
      } else {
        currentDriverPos = [DINDIGUL_GEO.nearbyCaptains[0].lat, DINDIGUL_GEO.nearbyCaptains[0].lng, 45];
      }
    }

    markersRef.current.driver = L.marker([currentDriverPos[0], currentDriverPos[1]], {
      icon: createCarIcon(currentDriverPos[2] || 0, true, 'TN 57 CE 4819'),
    }).addTo(map);

    // E. Nearby Idle Captains
    markersRef.current.nearby.forEach((m) => map.removeLayer(m));
    markersRef.current.nearby = [];

    DINDIGUL_GEO.nearbyCaptains.slice(1).forEach((c) => {
      const nm = L.marker([c.lat, c.lng], {
        icon: createCarIcon(c.heading, false, c.plate),
      }).addTo(map);
      markersRef.current.nearby.push(nm);
    });

    // Fit bounds smoothly
    const bounds = L.latLngBounds([pickup, destination, [currentDriverPos[0], currentDriverPos[1]]]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [pickupCoords, destinationCoords, driverCoords, tripState, pickupName, destName]);

  const handleZoomIn = () => mapInstanceRef.current && mapInstanceRef.current.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current && mapInstanceRef.current.zoomOut();
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(pickup, 15, { duration: 1 });
    }
  };

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`} style={{ height, minHeight: '220px' }}>
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Floating Map Controls */}
      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 400, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Style Toggle */}
        <button
          onClick={() => setMapStyle((s) => (s === 'voyager' ? 'dark' : 'voyager'))}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1E1236',
          }}
          title="Toggle Street / Dark Map"
        >
          <Layers size={17} />
        </button>

        {/* Recenter Pin */}
        <button
          onClick={handleRecenter}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4F46E5',
          }}
          title="Recenter on Pickup"
        >
          <Crosshair size={17} />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1E1236',
          }}
        >
          <Plus size={17} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1E1236',
          }}
        >
          <Minus size={17} />
        </button>
      </div>

      {/* Dindigul Live GPS Badge */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          zIndex: 400,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          borderRadius: '20px',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E293B' }}>Dindigul Live GPS</span>
      </div>
    </div>
  );
}
