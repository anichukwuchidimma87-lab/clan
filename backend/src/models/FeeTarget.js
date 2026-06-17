import mongoose from 'mongoose';

const feeTargetSchema = new mongoose.Schema({
  feeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeType',
    required: true
  },
  year: { type: Number, required: true },
  amount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

feeTargetSchema.index({ feeType: 1, year: 1 }, { unique: true });

export default mongoose.model('FeeTarget', feeTargetSchema);
