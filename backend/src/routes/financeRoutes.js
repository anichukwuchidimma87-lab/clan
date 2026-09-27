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
router.get('/fee-types', protect, authorize('superadmin', 'executive'), getFeeTypes);
router.post('/fee-types', protect, authorize('superadmin', 'executive'), createFeeType);
router.put('/fee-types/:id', protect, authorize('superadmin', 'executive'), updateFeeType);
router.put('/fee-targets', protect, authorize('superadmin', 'executive'), upsertFeeTarget);
router.put('/ledger/entry', protect, authorize('superadmin', 'executive'), upsertLedgerEntry);

export default router;