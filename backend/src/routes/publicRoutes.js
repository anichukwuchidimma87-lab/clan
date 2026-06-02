import express from 'express';
import { getPublicStats } from '../controllers/lectorController.js';

const router = express.Router();

router.get('/stats', getPublicStats);

export default router;
