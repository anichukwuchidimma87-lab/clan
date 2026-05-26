import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, enum: ['dues', 'seminar', 'competition'], required: true },
  datePaid: { type: Date, default: Date.now },
  recordedBy: { type: String, required: true } // Name of admin who took the cash
});

const financeSchema = new mongoose.Schema({
  parishName: { type: String, required: true },
  year: { type: Number, required: true },
  deanery: { type: String, default: "" },
  
  // Set Pricing configurations for the year
  duesPrice: { type: Number, default: 5000 },
  seminarPrice: { type: Number, default: 2500 },
  competitionPrice: { type: Number, default: 5000 },
  
  // CHANGED: Tracking actual amount currency paid instead of true/false
  duesPaidAmount: { type: Number, default: 0 },
  seminarPaidAmount: { type: Number, default: 0 },
  competitionPaidAmount: { type: Number, default: 0 },

  // History timeline array
  paymentHistory: [paymentLogSchema]
}, { timestamps: true });

financeSchema.index({ parishName: 1, year: 1 }, { unique: true });

export default mongoose.model('Finance', financeSchema);