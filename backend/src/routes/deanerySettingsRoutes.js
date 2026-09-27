import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { listDeaneryTargets, upsertDeaneryTarget } from '../controllers/deanerySettingsController.js';

const router = express.Router();

router.get('/', protect, authorize('executive', 'superadmin'), listDeaneryTargets);
router.post('/', protect, authorize('executive', 'superadmin'), upsertDeaneryTarget);

export default router;
