import express from 'express';
import { getPublicStats } from '../controllers/lectorController.js';
import { 
  getExecutives, 
  getPatrons, 
  getLeadershipProfiles, 
  getRecentEvents 
} from '../controllers/publicController.js';

const router = express.Router();

// Existing endpoint
router.get('/stats', getPublicStats);

// Leadership Showcase endpoints
router.get('/executives', getExecutives);
router.get('/patrons', getPatrons);
router.get('/leadership', getLeadershipProfiles);

// Recent Events endpoint (for the impact slider)
router.get('/recent-events', getRecentEvents);

export default router;
