import express from 'express';
import { getLedger, addParish, bulkUploadLedger, recordPayment, updateLedgerFees } from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ledger', protect, getLedger);
router.post('/parish', protect, authorize('superadmin', 'admin'), addParish);
router.post('/bulk-upload', protect, authorize('superadmin', 'admin'), bulkUploadLedger);
router.put('/ledger/pay/:id', protect, authorize('superadmin', 'admin'), recordPayment); // New payment logging endpoint
router.put('/ledger/fees/:id', protect, authorize('superadmin', 'admin'), updateLedgerFees);

export default router;