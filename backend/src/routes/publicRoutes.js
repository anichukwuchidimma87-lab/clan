import express from 'express';
import { getPublicStats } from '../controllers/lectorController.js';
import { 
  getExecutives, 
  getPatrons, 
  getLeadershipProfiles,
  getGalleryByCategory
} from '../controllers/publicController.js';
import { getRandomGallery, getRecentGallery } from '../controllers/galleryController.js';

const router = express.Router();

// Existing endpoint
router.get('/stats', getPublicStats);

// Leadership Showcase endpoints
router.get('/executives', getExecutives);
router.get('/patrons', getPatrons);
router.get('/leadership', getLeadershipProfiles);

// Gallery category endpoint for public leadership and executive content
router.get('/gallery', getGalleryByCategory);

// Dynamic gallery endpoints
router.get('/random-gallery', getRandomGallery);
router.get('/recent-events', getRecentGallery);

export default router;
