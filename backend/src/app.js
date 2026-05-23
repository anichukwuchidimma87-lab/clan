import express from 'express';
import cors from 'cors';
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Attach sub-routes
app.use('/api/v1', attendanceRoutes);

export default app;