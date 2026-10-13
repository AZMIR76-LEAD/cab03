import { Router } from 'express';
import { PlacesController } from '../controllers/placesController.js';
import { validateSavedPlace } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(PlacesController.getPlaces));
router.post('/', validateSavedPlace, asyncHandler(PlacesController.addPlace));
router.delete('/:id', asyncHandler(PlacesController.deletePlace));

export default router;
