import express from 'express';
import { 
  publicCheckIn, 
  getRegistryData, 
  updateLector, 
  deleteLector, 
  getActiveParishList, 
  bulkUploadParishes,
  bulkUnsuspend
} from '../controllers/lectorController.js';
import { protect, authorizeApproval } from '../middleware/authMiddleware.js'; // protect + role helpers

const router = express.Router();

// Publicly accessible paths
router.get('/parishes-list', getActiveParishList);
router.post('/checkin', publicCheckIn);

// Secure executive registry paths (Protected by your protect middleware)
router.get('/registry', protect, getRegistryData);
router.post('/parishes/bulk-upload', protect, bulkUploadParishes);
router.put('/update/:id', protect, updateLector);
router.delete('/delete/:id', protect, deleteLector);
router.post('/bulk-unsuspend', protect, authorizeApproval, bulkUnsuspend);

export default router;