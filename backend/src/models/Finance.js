import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  parishName: { type: String, required: true, unique: true },
  zone: { type: String, required: true, enum: ['Benin City', 'Abudu', 'Iguobazuwa'] },
  duesPaid: { type: Boolean, default: false },       // ₦5,000
  seminarPaid: { type: Boolean, default: false },     // ₦2,000
  competitionPaid: { type: Boolean, default: false }, // ₦3,000
  history: [
    {
      updatedBy: String,
      updatedAt: { type: Date, default: Date.now },
      action: String
    }
  ]
}, { timestamps: true });

export default mongoose.model('Finance', financeSchema);