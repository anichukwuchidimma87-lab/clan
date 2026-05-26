import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  parishName: { type: String, required: true },
  year: { type: Number, required: true },
  deanery: { type: String, default: "" }, // FIXED: Renamed from zone to deanery
  
  duesPrice: { type: Number, default: 5000 },
  seminarPrice: { type: Number, default: 2500 },
  competitionPrice: { type: Number, default: 5000 },
  
  duesPaid: { type: Boolean, default: false },
  seminarPaid: { type: Boolean, default: false },
  competitionPaid: { type: Boolean, default: false },
}, { timestamps: true });

financeSchema.index({ parishName: 1, year: 1 }, { unique: true });

export default mongoose.model('Finance', financeSchema);