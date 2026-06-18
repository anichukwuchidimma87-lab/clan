import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: Date, required: true },
  location: { type: String, trim: true },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
  coverImage: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
