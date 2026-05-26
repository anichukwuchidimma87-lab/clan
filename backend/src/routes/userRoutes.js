import express from 'express';
import { getPendingUsers, approveUser } from '../controllers/userController.js';
import { protect, authorizeApproval } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only let approved Admins/Execs access these
router.get('/pending', protect, authorizeApproval, getPendingUsers);
router.patch('/approve/:id', protect, authorizeApproval, approveUser);

export default router;