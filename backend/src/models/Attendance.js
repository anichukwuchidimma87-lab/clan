import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  isGuest: { type: Boolean, default: false },
  fullName: { type: String, required: true },
  // Linked to our new Parish model
  parish: { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema);