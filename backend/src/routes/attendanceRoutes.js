import express from 'express';
import { processCheckIn } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { deleteAttendance } from '../controllers/attendanceController.js';


const router = express.Router();
// Only IT Admins can delete records
router.delete('/attendance/:id', protect, authorize('IT_ADMIN'), deleteAttendance);

// Secretaries and IT Admins can view the registry
router.get('/attendance', protect, authorize('IT_ADMIN', 'SECRETARY'), getAttendance);


router.post('/checkin', processCheckIn);

export default router;