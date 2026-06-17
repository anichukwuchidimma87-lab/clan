import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema({
  parish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parish',
    required: true
  },
  feeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeType',
    required: true
  },
  year: { type: Number, required: true },
  amountPaid: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

ledgerEntrySchema.index({ parish: 1, feeType: 1, year: 1 }, { unique: true });

export default mongoose.model('LedgerEntry', ledgerEntrySchema);
