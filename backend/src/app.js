import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js'; // 1. Add this import

const app = express();

app.use(express.json());

// ... (your existing CORS configuration) ...

// 2. Mount BOTH sets of routes
app.use('/api/v1', attendanceRoutes);
app.use('/api/v1', authRoutes); // This enables /api/v1/login

export default app;