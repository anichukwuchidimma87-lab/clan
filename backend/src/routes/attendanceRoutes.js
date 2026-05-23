import express from 'express';
import { processCheckIn } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/checkin', processCheckIn);

export default router;