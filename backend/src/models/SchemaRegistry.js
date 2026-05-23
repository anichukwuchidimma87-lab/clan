// backend/src/models/SchemaRegistry.js

import mongoose from 'mongoose';

// 1. Section Model
const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['Benin City', 'Abudu', 'Iguobazuwa'] }
});

// 2. Parish Model (linked to Section)
const ParishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }
});

// 3. Updated Attendance Model (linked to Parish)
const AttendanceSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  parish: { type: mongoose.Schema.Types.ObjectId, ref: 'Parish', required: true },
  role: { type: String, required: true },
  isGuest: { type: Boolean, default: false }
}, { timestamps: true });

export const Section = mongoose.model('Section', SectionSchema);
export const Parish = mongoose.model('Parish', ParishSchema);
export const Attendance = mongoose.model('Attendance', AttendanceSchema);