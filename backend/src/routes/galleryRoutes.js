import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { createGalleryItem, getGalleryItems, updateGalleryItem, deleteGalleryItem } from '../controllers/galleryController.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'superadmin'), getGalleryItems);
router.post('/', protect, authorize('admin', 'superadmin'), upload.single('file'), createGalleryItem);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateGalleryItem);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteGalleryItem);

export default router;
