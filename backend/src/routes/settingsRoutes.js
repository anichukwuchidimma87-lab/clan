import express from 'express';
import { getPublicSettings, uploadLogo, setLogoUrl } from '../controllers/siteSettingsController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/public/settings', getPublicSettings);

// Executive: upload file (multipart)
router.patch('/v1/settings/logo', protect, authorize('executive', 'superadmin'), upload.single('logo'), uploadLogo);

// Executive: set external URL
router.patch('/v1/settings/logo-url', protect, authorize('executive', 'superadmin'), setLogoUrl);

export default router;
