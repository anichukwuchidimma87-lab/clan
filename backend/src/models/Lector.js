import mongoose from 'mongoose';

const lectorSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  deanery: { type: String, required: true, enum: ['Benin', 'Abudu', 'Eguabazua'] },
  parishName: { type: String, required: true },
  
  // Designations inside the specific parish
  roleInParish: { 
    type: String, 
    required: true, 
    enum: ['Active Member', 'Parish President', 'Parish Vice President', 'Parish Secretary', 'Parish Executive'],
    default: 'Active Member' 
  },
  
  // Status state tracking controls
  status: { 
    type: String, 
    required: true, 
    enum: ['Active', 'Suspended'], 
    default: 'Active' 
  },
  yearRegistered: { type: Number, default: () => new Date().getFullYear() }
}, { timestamps: true });

// Prevent a lector with the same first and last name from duplicating inside the same church
lectorSchema.index({ firstName: 1, lastName: 1, parishName: 1 }, { unique: true });

export default mongoose.model('Lector', lectorSchema);