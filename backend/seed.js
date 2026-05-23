import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clan_attendance';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔗 Connected to Database for Seeding...');

    const adminExists = await User.findOne({ email: 'admin@clan.org' });

    if (!adminExists) {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@clan.org',
        password: 'Password123!', // Change this immediately after first login!
        role: 'IT_ADMIN'
      });
      console.log('✅ Admin User Created:', admin.email);
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedAdmin();