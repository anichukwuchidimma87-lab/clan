import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: { type: String },
  affectedCount: { type: Number, default: 0 },
  ids: { type: [String], default: [] },
  all: { type: Boolean, default: false },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditLogSchema);
