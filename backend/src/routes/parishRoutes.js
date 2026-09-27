import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getParishes,
  getParishesWithCounts,
  getInactiveParishesReport,
  createParish,
  updateParish,
  deleteParish,
  getParishMembers
} from '../controllers/parishController.js';

const router = express.Router();

router.get('/', protect, authorize('executive', 'superadmin'), getParishes);
router.get('/with-counts', protect, authorize('executive', 'superadmin'), getParishesWithCounts);
router.get('/inactive-report', protect, authorize('executive', 'superadmin'), getInactiveParishesReport);
router.post('/', protect, authorize('executive', 'superadmin'), createParish);
router.patch('/:id', protect, authorize('executive', 'superadmin'), updateParish);
router.delete('/:id', protect, authorize('executive', 'superadmin'), deleteParish);
router.get('/:id/members', protect, authorize('executive', 'superadmin'), getParishMembers);

export default router;