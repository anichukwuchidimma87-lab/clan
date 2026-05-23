import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(express.json());

// Optimized CORS configuration to prevent blocking
app.use(cors({
  origin: (origin, callback) => {
    // Allow all Vercel domains and Localhost for development
    if (!origin || origin.endsWith('.vercel.app') || origin.includes('localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure we handle Preflight OPTIONS requests
app.options('*', cors());

// Mount Routes
app.use('/api/v1', attendanceRoutes);
app.use('/api/v1', authRoutes);

export default app;