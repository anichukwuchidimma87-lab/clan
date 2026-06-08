import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'member'], 
    default: 'member' 
  },
  // Added fields to support approval workflow
  status: { 
    type: String, 
    enum: ['pending', 'approved'], 
    default: 'pending' 
  },
  position: { 
    type: String, 
    default: 'Member' 
  },
  // Profile image URL from Cloudinary
  profileImage: { 
    type: String, 
    default: null 
  },
  // Profile title or tagline for leadership showcase
  profileTitle: {
    type: String,
    default: null
  }
});

// Helper method to match password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Assuming you are using bcrypt
  // return await bcrypt.compare(enteredPassword, this.password);
  return enteredPassword === this.password; // Replace with your actual bcrypt logic
};

const User = mongoose.model('User', UserSchema);

export default User;