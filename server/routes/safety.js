import { Router } from 'express';
import { SafetyController } from '../controllers/safetyController.js';
import { validateEmergencyContact } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/contacts', asyncHandler(SafetyController.getEmergencyContacts));
router.post('/contacts', validateEmergencyContact, asyncHandler(SafetyController.addEmergencyContact));
router.delete('/contacts/:id', asyncHandler(SafetyController.deleteEmergencyContact));
router.post('/sos', asyncHandler(SafetyController.triggerSos));

export default router;
