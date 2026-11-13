// Source: Google Maps Platform Code Assist
// FG DRIVO Routes & Directions Gateway
import { Router } from 'express';
import { RoutesService } from '../services/routesService.js';

const router = Router();

router.get('/directions', async (req, res, next) => {
  try {
    const { origin, destination, travelMode, routingPreference, apiKey } = req.query;

    let oCoords = { lat: 10.3644, lng: 77.9702 }; // Dindigul Junction default
    let dCoords = { lat: 10.3812, lng: 77.9480 }; // Palani Rd Bypass default

    if (origin) {
      const parts = origin.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        oCoords = { lat: parts[0], lng: parts[1] };
      }
    }

    if (destination) {
      const parts = destination.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        dCoords = { lat: parts[0], lng: parts[1] };
      }
    }

    const route = await RoutesService.getDirections({
      origin: oCoords,
      destination: dCoords,
      travelMode: travelMode || 'DRIVE',
      routingPreference: routingPreference || 'TRAFFIC_AWARE',
      apiKey,
    });

    return res.json({
      success: true,
      route,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/directions', async (req, res, next) => {
  try {
    const { origin, destination, travelMode, routingPreference, apiKey } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination coordinates are required' });
    }

    const route = await RoutesService.getDirections({
      origin,
      destination,
      travelMode: travelMode || 'DRIVE',
      routingPreference: routingPreference || 'TRAFFIC_AWARE',
      apiKey,
    });

    return res.json({
      success: true,
      route,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

