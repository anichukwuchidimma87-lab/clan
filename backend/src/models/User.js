const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'member'], 
    default: 'member' 
  },
  position: { type: String, default: 'None' }, // e.g., 'President', 'Secretary'
  status: { 
    type: String, 
    enum: ['pending', 'approved'], 
    default: 'pending' // New users start here
  }
});