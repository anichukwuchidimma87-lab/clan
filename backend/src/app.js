import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';

// 1. DEFINE app FIRST
const app = express();

// 2. NOW you can use it
app.use(express.json());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // or allow any subdomain of vercel.app
    if (!origin || origin.endsWith('.vercel.app') || origin.includes('localhost:5173')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. YOUR ROUTES
app.use('/api/v1', attendanceRoutes);

// 4. FINALLY, EXPORT IT
export default app;