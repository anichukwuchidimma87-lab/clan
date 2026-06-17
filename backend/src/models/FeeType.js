import mongoose from 'mongoose';

const feeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('FeeType', feeTypeSchema);
