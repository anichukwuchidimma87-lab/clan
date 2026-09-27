import mongoose from 'mongoose';

const DeanerySettingSchema = new mongoose.Schema({
  deanery: { type: String, required: true, unique: true },
  healthTarget: { type: Number, default: 50 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('DeanerySetting', DeanerySettingSchema);
