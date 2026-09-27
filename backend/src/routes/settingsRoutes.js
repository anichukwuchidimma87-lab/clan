import express from 'express';
import { getPublicSettings, uploadLogo, setLogoUrl } from '../controllers/siteSettingsController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/public/settings', getPublicSettings);

// Admin: upload file (multipart)
router.patch('/v1/settings/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

// Admin: set external URL
router.patch('/v1/settings/logo-url', protect, authorize('admin'), setLogoUrl);

export default router;
