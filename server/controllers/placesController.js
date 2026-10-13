// FG DRIVO Saved Places & Bookmarks Controller
import { db } from '../db.js';
import { ApiError } from '../middleware/errorHandler.js';

export class PlacesController {
  static getPlaces(req, res) {
    const places = db.get('savedPlaces') || [];
    return res.json({ places });
  }

  static addPlace(req, res) {
    const { name, address, type = 'favorite', coords = { x: 50, y: 50 } } = req.body;
    const places = db.get('savedPlaces') || [];

    const newPlace = {
      id: 'place-' + Date.now(),
      type,
      name: name.trim(),
      address: address.trim(),
      coords,
    };

    places.push(newPlace);
    db.set('savedPlaces', places);

    return res.status(201).json({
      success: true,
      message: 'Saved place created successfully.',
      place: newPlace,
    });
  }

  static deletePlace(req, res) {
    const { id } = req.params;
    const places = db.get('savedPlaces') || [];
    const exists = places.some((p) => p.id === id);

    if (!exists) {
      throw new ApiError('Saved place not found with ID: ' + id, 404);
    }

    const filtered = places.filter((p) => p.id !== id);
    db.set('savedPlaces', filtered);

    return res.json({
      success: true,
      message: 'Saved place deleted successfully.',
    });
  }
}
