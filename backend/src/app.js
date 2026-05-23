import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();

// Configure strict cross-origin resource sharing headers for security
app.use(cors({
  origin: [
    'http://localhost:5173',                   // Allows local Vite dev environment to connect
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Deployment health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: "healthy", message: "CLAN Core Engine is online." });
});

// Attach sub-routes
app.use('/api/v1', attendanceRoutes);

export default app;