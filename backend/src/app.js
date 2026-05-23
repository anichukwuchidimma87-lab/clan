import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';

// 1. DEFINE app FIRST
const app = express();

// 2. NOW you can use it
app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://clan-omega.vercel.app', 
    'https://clan-lywmh76ho-chidimma-s-projects.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. YOUR ROUTES
app.use('/api/v1', attendanceRoutes);

// 4. FINALLY, EXPORT IT
export default app;