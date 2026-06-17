import express from 'express';
import {
  getLedger,
  getLedgerSummary,
  upsertLedgerEntry,
  getFeeTypes,
  createFeeType,
  updateFeeType,
  upsertFeeTarget
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/ledger', protect, getLedger);
router.get('/ledger/summary', protect, getLedgerSummary);
router.get('/fee-types', protect, authorize('superadmin', 'admin'), getFeeTypes);
router.post('/fee-types', protect, authorize('superadmin', 'admin'), createFeeType);
router.put('/fee-types/:id', protect, authorize('superadmin', 'admin'), updateFeeType);
router.put('/fee-targets', protect, authorize('superadmin', 'admin'), upsertFeeTarget);
router.put('/ledger/entry', protect, authorize('superadmin', 'admin'), upsertLedgerEntry);

export default router;