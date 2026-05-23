import express from 'express';
import { processCheckIn, deleteAttendance, getAttendance } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes
router.post('/checkin', processCheckIn);

// Protected routes (Only IT_ADMIN or SECRETARY can access)
router.get('/attendance', protect, authorize('IT_ADMIN', 'SECRETARY'), getAttendance);
router.delete('/attendance/:id', protect, authorize('IT_ADMIN'), deleteAttendance);

export default router;