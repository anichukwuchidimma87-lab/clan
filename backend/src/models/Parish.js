import mongoose from 'mongoose';

const ParishSchema = new mongoose.Schema({
  // The official name of the parish (e.g., "Assumption Catholic Church, Uteh")
  name: { type: String, required: true, unique: true, trim: true },
  
  // Explicitly restricted to your immediate jurisdiction (Benin City Deanery)
  zone: { 
    type: String, 
    required: true, 
    enum: ['Benin'], 
    default: 'Benin' 
  }
}, { timestamps: true });

export default mongoose.model('Parish', ParishSchema);