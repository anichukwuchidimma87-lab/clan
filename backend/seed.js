import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js'; // Ensure path is correct

const createSuperAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const superAdmin = new User({
    name: 'Super Admin',
    email: 'admin@clan.org',
    password: hashedPassword,
    role: 'superadmin'
  });

  await superAdmin.save();
  console.log('✅ Super Admin created!');
  process.exit();
};

createSuperAdmin();