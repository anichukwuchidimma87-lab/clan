import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  parishName: { type: String, required: true },
  year: { type: Number, required: true }, // e.g., 2024, 2025, 2026
  zone: { type: String, default: "" },
  
  // Dynamic Pricing Configuration for this specific year
  duesPrice: { type: Number, default: 5000 },
  seminarPrice: { type: Number, default: 2500 },
  competitionPrice: { type: Number, default: 5000 },
  
  // Payment Status Flags
  duesPaid: { type: Boolean, default: false },
  seminarPaid: { type: Boolean, default: false },
  competitionPaid: { type: Boolean, default: false },
}, { timestamps: true });

// Make sure a parish can only have one financial record per year
financeSchema.index({ parishName: 1, year: 1 }, { unique: true });

export default mongoose.model('Finance', financeSchema);