import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getUpcomingEvents,
  toggleEventStatus,
  generateCaption
} from '../controllers/eventController.js';

const router = express.Router();

// Public: upcoming events for landing
router.get('/upcoming', getUpcomingEvents);

// Admin routes
router.get('/', protect, authorize('admin', 'superadmin'), getEvents);
router.post('/', protect, authorize('admin', 'superadmin'), createEvent);
router.patch('/:id', protect, authorize('admin', 'superadmin'), updateEvent);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteEvent);
router.post('/:id/toggle', protect, authorize('admin', 'superadmin'), toggleEventStatus);
router.get('/:id/generate-caption', protect, authorize('admin', 'superadmin'), generateCaption);

export default router;
