import express from 'express';
import { getLedger, updatePayment } from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in authorized users can view or edit the ledger
router.get('/ledger', protect, getLedger);
router.put('/ledger/:id', protect, authorize('IT_ADMIN', 'SECRETARY'), updatePayment);

export default router;