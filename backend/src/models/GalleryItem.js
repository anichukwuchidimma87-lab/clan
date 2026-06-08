import mongoose from 'mongoose';

const galleryItemSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  caption: { type: String, trim: true },
  url: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['seminar', 'orphanage', 'awardees', 'voalc', 'patrons', 'executives', 'events']
  },
  featured: { type: Boolean, default: false },
  tags: [String],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const GalleryItem = mongoose.model('GalleryItem', galleryItemSchema);

export default GalleryItem;
