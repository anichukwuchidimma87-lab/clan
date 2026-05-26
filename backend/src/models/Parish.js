import mongoose from 'mongoose';

const ParishSchema = new mongoose.Schema({
  // Kept as 'name' to protect your financial ledger queries, but added unique constraint for clean bulk-uploads
  name: { type: String, required: true, unique: true, trim: true },
  
  // Kept as 'zone' to match your ledger, but mapped to support Benin, Abudu, Eguabazua
  zone: { type: String, required: true, enum: ['Benin', 'Abudu', 'Eguabazua'], default: 'Benin' },
  
  // ORIGINAL FINANCIAL FIELDS (Completely untouched so your ledger runs perfectly!)
  duesPaid: { type: Number, default: 0 },
  duesTarget: { type: Number, default: 5000 },
  seminarPaid: { type: Number, default: 0 },
  seminarTarget: { type: Number, default: 2000 },
  competitionPaid: { type: Number, default: 0 },
  competitionTarget: { type: Number, default: 3000 }
}, { timestamps: true });

export default mongoose.model('Parish', ParishSchema);