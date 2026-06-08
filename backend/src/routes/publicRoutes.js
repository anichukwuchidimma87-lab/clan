import express from 'express';
import { getPublicStats } from '../controllers/lectorController.js';
import { 
  getExecutives, 
  getPatrons, 
  getLeadershipProfiles
} from '../controllers/publicController.js';
import { getRandomGallery, getRecentGallery } from '../controllers/galleryController.js';

const router = express.Router();

// Existing endpoint
router.get('/stats', getPublicStats);

// Leadership Showcase endpoints
router.get('/executives', getExecutives);
router.get('/patrons', getPatrons);
router.get('/leadership', getLeadershipProfiles);

// Dynamic gallery endpoints
router.get('/random-gallery', getRandomGallery);
router.get('/recent-events', getRecentGallery);

export default router;
