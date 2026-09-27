import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getUpcomingEvents,
  getPublicEvents,
  toggleEventStatus,
  generateCaption,
  bulkImportEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Public: upcoming events for landing
router.get('/upcoming', getUpcomingEvents);
router.get('/all', getPublicEvents);

// Executive routes
router.get('/', protect, authorize('executive', 'superadmin'), getEvents);
router.post('/', protect, authorize('executive', 'superadmin'), createEvent);
router.post('/bulk-import', protect, authorize('executive', 'superadmin'), bulkImportEvents);
router.patch('/:id', protect, authorize('executive', 'superadmin'), updateEvent);
router.delete('/:id', protect, authorize('executive', 'superadmin'), deleteEvent);
router.post('/:id/toggle', protect, authorize('executive', 'superadmin'), toggleEventStatus);
router.get('/:id/generate-caption', protect, authorize('executive', 'superadmin'), generateCaption);

export default router;
