import express from 'express';
import { getPendingUsers, approveUser, updateUserProfile } from '../controllers/userController.js';
import { protect, authorizeApproval } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Only let approved Admins/Execs access these
router.get('/pending', protect, authorizeApproval, getPendingUsers);
router.patch('/approve/:id', protect, authorizeApproval, approveUser);

// Update user profile with optional image upload
router.patch('/profile/:userId', protect, authorizeApproval, upload.single('profileImage'), updateUserProfile);

export default router;