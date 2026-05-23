// backend/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const createSuperAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const hashedPassword = await bcrypt.hash('YourSecurePassword123!', 10);
  
  const superAdmin = new User({
    email: 'admin@clan.org',
    password: hashedPassword,
    role: 'superadmin'
  });

  await superAdmin.save();
  console.log('Super Admin created successfully!');
  process.exit();
};

createSuperAdmin();