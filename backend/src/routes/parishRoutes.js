import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getParishes,
  getParishesWithCounts,
  createParish,
  updateParish,
  deleteParish,
  getParishMembers
} from '../controllers/parishController.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'superadmin'), getParishes);
router.get('/with-counts', protect, authorize('admin', 'superadmin'), getParishesWithCounts);
router.post('/', protect, authorize('admin', 'superadmin'), createParish);
router.patch('/:id', protect, authorize('admin', 'superadmin'), updateParish);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteParish);
router.get('/:id/members', protect, authorize('admin', 'superadmin'), getParishMembers);

export default router;