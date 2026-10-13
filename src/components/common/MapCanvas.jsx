// Source: Google Maps Platform
// FG DRIVO Pure Google Maps Engine

import React from 'react';
import GoogleMapCanvas from './GoogleMapCanvas';

export default function MapCanvas({
  pickup = { name: 'Dindigul Junction', lat: 10.3644, lng: 77.9702, x: 38, y: 70 },
  destination = { name: 'Palani Road, Dindigul', lat: 10.3686, lng: 77.9745, x: 72, y: 32 },
  driverPosition = null,
  showRoute = true,
  tripState = 'idle',
  progress = null,
  driverName = 'Arjun K.',
  carModel = 'Swift Dzire',
  interactive = true,
  onMapClick = null,
  height = '100%',
  className = '',
}) {
  // Convert coordinates to real Dindigul Lat/Lng
  const pickupLat = pickup?.lat || (10.3644 + ((pickup?.y || 70) - 70) * -0.0005);
  const pickupLng = pickup?.lng || (77.9702 + ((pickup?.x || 38) - 38) * 0.0005);
  const destLat = destination?.lat || (10.3812 + ((destination?.y || 32) - 32) * -0.0005);
  const destLng = destination?.lng || (77.9480 + ((destination?.x || 72) - 72) * 0.0005);

  let driverCoords = null;
  if (driverPosition && driverPosition.lat && driverPosition.lng) {
    driverCoords = driverPosition;
  } else if (driverPosition && typeof driverPosition.x === 'number') {
    driverCoords = {
      lat: 10.3644 + (driverPosition.y - 70) * -0.0005,
      lng: 77.9702 + (driverPosition.x - 38) * 0.0005,
      heading: driverPosition.angle || 45,
    };
  }

  return (
    <div
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ height, minHeight: '220px', position: 'relative' }}
      onClick={onMapClick}
    >
      <GoogleMapCanvas
        pickupCoords={[pickupLat, pickupLng]}
        destinationCoords={[destLat, destLng]}
        driverCoords={driverCoords}
        pickupName={pickup?.name || 'Dindigul Junction'}
        destName={destination?.name || 'Palani Road, Dindigul'}
        tripState={tripState}
        height="100%"
      />
    </div>
  );
}
