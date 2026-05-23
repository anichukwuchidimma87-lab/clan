import mongoose from 'mongoose';

// 1. The Section Model
const SectionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true } // e.g., "Benin City", "Abudu", "Iguobazuwa"
});

// 2. The Parish Model (linked to a Section)
const ParishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true }
});

export const Section = mongoose.model('Section', SectionSchema);
export const Parish = mongoose.model('Parish', ParishSchema);