import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js'; // Adjust paths based on your actual structure

const app = express();

app.use(express.json());

// ✅ Whitelist your live Vercel production domain
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://clan-omega.vercel.app' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Your routes configuration below...
app.use('/api/v1', attendanceRoutes);

export default app;