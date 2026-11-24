import express from 'express';
import { 
  publicCheckIn, 
  addLector,
  getUpcomingBirthdays,
  getBirthdayWhatsAppDraft,
  getPublicBirthdays,
  getRegistryData, 
  updateLector, 
  deleteLector, 
  getActiveParishList, 
  bulkUploadParishes,
  bulkUnsuspend
} from '../controllers/lectorController.js';
import { protect, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible paths
router.get('/parishes-list', getActiveParishList);
router.post('/checkin', publicCheckIn);

// Secure executive registry paths (Protected by your protect middleware)
router.get('/registry', protect, getRegistryData);
router.get('/birthdays', protect, getUpcomingBirthdays);
router.get('/birthdays/:lectorId/whatsapp-draft', protect, getBirthdayWhatsAppDraft);
router.get('/public-birthdays', getPublicBirthdays);
router.post('/registry', protect, requirePermission('add'), addLector);
router.post('/parishes/bulk-upload', protect, bulkUploadParishes);
router.put('/update/:id', protect, updateLector);
router.delete('/delete/:id', protect, requirePermission('delete'), deleteLector);
router.post('/bulk-unsuspend', protect, bulkUnsuspend);

export default router;