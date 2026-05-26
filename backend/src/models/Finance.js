import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, enum: ['dues', 'seminar', 'competition'], required: true },
  datePaid: { type: Date, default: Date.now },
  recordedBy: { type: String, required: true } // Admin name from validation token payload
});

const financeSchema = new mongoose.Schema({
  // Relational link pointing directly to your Master Parish document in the Registry
  parish: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Parish', 
    required: true 
  },
  // ADDED: This explicitly maps the string name to satisfy the database constraint rule!
  parishName: {
    type: String,
    required: true
  },
  year: { type: Number, required: true },
  deanery: { type: String, enum: ['Benin'], default: 'Benin' },
  
  // Annual target price baselines
  duesPrice: { type: Number, default: 5000 },
  seminarPrice: { type: Number, default: 2500 },
  competitionPrice: { type: Number, default: 5000 },
  
  // Real-time currency trackers
  duesPaidAmount: { type: Number, default: 0 },
  seminarPaidAmount: { type: Number, default: 0 },
  competitionPaidAmount: { type: Number, default: 0 },

  // Transaction history audit timelines
  paymentHistory: [paymentLogSchema]
}, { timestamps: true });

// Ensures a single parish can only have one financial ledger document sheet mapping per calendar year
financeSchema.index({ parish: 1, year: 1 }, { unique: true });

export default mongoose.model('Finance', financeSchema);