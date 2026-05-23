import mongoose from 'mongoose';

const ParishSchema = new mongoose.Schema({
  name: String,
  zone: String,
  duesPaid: { type: Number, default: 0 },
  duesTarget: { type: Number, default: 5000 },
  seminarPaid: { type: Number, default: 0 },
  seminarTarget: { type: Number, default: 2000 },
  competitionPaid: { type: Number, default: 0 },
  competitionTarget: { type: Number, default: 3000 }
});

export default mongoose.model('Parish', ParishSchema);