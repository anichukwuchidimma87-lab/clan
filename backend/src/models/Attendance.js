import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  isGuest: { type: Boolean, required: true },
  fullName: { type: String, required: true },
  parish: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;