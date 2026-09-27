import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { createGalleryItem, getGalleryItems, updateGalleryItem, deleteGalleryItem } from '../controllers/galleryController.js';

const router = express.Router();

router.get('/', protect, authorize('executive', 'superadmin'), getGalleryItems);
router.post('/', protect, authorize('executive', 'superadmin'), upload.single('file'), createGalleryItem);
router.put('/:id', protect, authorize('executive', 'superadmin'), upload.single('file'), updateGalleryItem);
router.delete('/:id', protect, authorize('executive', 'superadmin'), deleteGalleryItem);

export default router;
