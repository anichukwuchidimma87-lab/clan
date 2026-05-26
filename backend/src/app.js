import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import parishRoutes from './routes/parishRoutes.js'; // 1. Import it here
import financeRoutes from './routes/financeRoutes.js';


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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 2. Added PATCH for updates
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// Mount Routes
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parishes', parishRoutes); // 3. Mount it here
// Add this line where your other app.use('/api/...') lines are located
app.use('/api/finance', financeRoutes);

export default app;