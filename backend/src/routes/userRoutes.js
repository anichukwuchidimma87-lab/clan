import express from 'express';
import {
  getPendingUsers,
  getApprovedUsers,
  approveUser,
  createExecutiveMember,
  getUserProfile,
  updateUserProfile,
  updateUserRole
} from '../controllers/userController.js';
import { protect, authorizeApproval } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeApproval, getApprovedUsers);
router.get('/pending', protect, authorizeApproval, getPendingUsers);
router.get('/profile/:userId', protect, getUserProfile);
router.patch('/approve/:id', protect, authorizeApproval, approveUser);
router.patch('/:id/role', protect, authorizeApproval, updateUserRole);
router.post('/executive', protect, authorizeApproval, createExecutiveMember);
router.patch('/profile/:userId', protect, upload.single('profileImage'), updateUserProfile);

export default router;