import express from 'express';
import { getLedger, updatePayment, addParish, bulkUploadLedger } from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ledger', protect, getLedger);
router.post('/parish', protect, authorize('superadmin', 'admin'), addParish);
router.post('/bulk-upload', protect, authorize('superadmin', 'admin'), bulkUploadLedger); // Bulk route
router.put('/ledger/:id', protect, authorize('superadmin', 'admin'), updatePayment);

export default router;