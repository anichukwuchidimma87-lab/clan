import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  isGuest: { type: Boolean, default: false },
  fullName: { type: String, required: true },
  role: { type: String, required: true },
  
  // Storing hierarchy as a sub-document for now 
  // (Easier to query while you finish setting up the Parish/Section collections)
  hierarchy: {
    section: { type: String, required: true },
    parish: { type: String, required: true }
  },
  
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema);