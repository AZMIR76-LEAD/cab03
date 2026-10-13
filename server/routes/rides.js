import { Router } from 'express';
import { RidesController } from '../controllers/ridesController.js';
import { validateBooking } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/estimate', asyncHandler(RidesController.getFareEstimates));
router.post('/book', validateBooking, asyncHandler(RidesController.bookRide));
router.get('/active', asyncHandler(RidesController.getActiveRide));
router.post('/advance-simulation', asyncHandler(RidesController.advanceSimulation));
router.post('/cancel', asyncHandler(RidesController.cancelRide));
router.post('/:id/rate', asyncHandler(RidesController.rateRide));
router.get('/history', asyncHandler(RidesController.getRideHistory));
router.get('/algorithm-diagnostics', asyncHandler(RidesController.getAlgorithmDiagnostics));
router.get('/:id/receipt', asyncHandler(RidesController.getReceipt));

export default router;
