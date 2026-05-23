import app from './src/app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clan_attendance';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`📡 MongoDB Atlas Pipeline Connected Successfully.`);
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 CLAN CORE ENGINE ACTIVE: Listening on Port ${PORT}`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error(`❌ CRITICAL FAILURE: Database connection broken.`);
    console.error(err);
    process.exit(1);
  });