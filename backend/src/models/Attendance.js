import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  isGuest: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  details: {
    memberId: { type: String, default: null },
    title: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    fullName: { 
      type: String, 
      required: true 
    },
    parish: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      required: true,
      default: 'Delegate / Member' 
    }
  }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;