import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { listAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.get('/logs', protect, authorize('executive', 'superadmin'), listAuditLogs);

export default router;
