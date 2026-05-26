import express from 'express';
import { 
  publicCheckIn, 
  getRegistryData, 
  updateLector, 
  deleteLector, 
  getActiveParishList, // The dropdown helper
  bulkUploadParishes   // The Excel upload engine
} from '../controllers/lectorController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // Your auth gate

const router = express.Router();

// Publicly accessible paths
router.get('/parishes-list', getActiveParishList);
router.post('/checkin', publicCheckIn);

// Secure executive registry paths (Protected by your login token middleware)
router.get('/registry', verifyToken, getRegistryData);
router.post('/parishes/bulk-upload', verifyToken, bulkUploadParishes);
router.put('/update/:id', verifyToken, updateLector);
router.delete('/delete/:id', verifyToken, deleteLector);

export default router;