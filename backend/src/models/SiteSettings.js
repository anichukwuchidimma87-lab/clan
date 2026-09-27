import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema({
  name: { type: String, default: 'CLAN Deanery' },
  logoUrl: { type: String, default: '' },
  logoSource: { type: String, enum: ['uploaded', 'external', 'none'], default: 'none' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SiteSettings', SiteSettingsSchema);
