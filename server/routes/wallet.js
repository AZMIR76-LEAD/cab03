import { Router } from 'express';
import { WalletController } from '../controllers/walletController.js';
import { validateTopup } from '../middleware/validator.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(WalletController.getWallet));
router.post('/topup', validateTopup, asyncHandler(WalletController.topup));
router.post('/add-card', asyncHandler(WalletController.addCard));

export default router;
