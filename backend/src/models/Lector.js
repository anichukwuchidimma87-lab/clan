import mongoose from 'mongoose';

const lectorSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  ageBracket: { 
    type: String, 
    required: true, 
    enum: ['Under 20', '21–30', '31–40', '41–50', '51+'] 
  },
  yearCommissioned: { type: Number, default: null },
  employmentStatus: { 
    type: String, 
    required: true, 
    enum: ['Employed', 'Self-Employed', 'Student', 'Unemployed'] 
  },
  deanery: { type: String, required: true, enum: ['Benin', 'Abudu', 'Eguabazua'] },
  parish: { type: mongoose.Schema.Types.ObjectId, ref: 'Parish' },
  parishName: { type: String, required: true }, // Verified structural match string
  roleInParish: { 
    type: String, 
    required: true, 
    enum: ['Active Member', 'Parish President', 'Parish Vice President', 'Parish Secretary', 'Parish Executive'],
    default: 'Active Member' 
  },
  status: { type: String, required: true, enum: ['Active', 'Suspended'], default: 'Active' },
  yearRegistered: { type: Number, default: () => new Date().getFullYear() }
}, { timestamps: true });

// Strict safety validator preventing twin submissions in the same building
lectorSchema.index({ firstName: 1, lastName: 1, parishName: 1 }, { unique: true });

export default mongoose.model('Lector', lectorSchema);