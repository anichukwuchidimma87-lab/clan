// server.js (located in the root)
import app from './src/app.js'; // Ensure the path explicitly says './src/'
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`📡 MongoDB Atlas Connected.`);
    app.listen(PORT, () => {
      console.log(`🚀 Server active on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ Connection failed:`, err);
    process.exit(1);
  });