import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import parishRoutes from './routes/parishRoutes.js'; 
import financeRoutes from './routes/financeRoutes.js';
import lectorRoutes from './routes/lectorRoutes.js'; // 1. Imported your lector routes file
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.vercel.app') || origin.includes('localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// Mount Routes
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parishes', parishRoutes); 
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);

// 2. Mounted your lector routes so the URLs match your frontend perfectly!
app.use('/api/lectors', lectorRoutes);

export default app;