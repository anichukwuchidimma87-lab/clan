import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  firstName: { type: String, default: '' },
  middleName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  tokenVersion: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ['superadmin', 'executive', 'president', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disabled'],
    default: 'approved'
  },
  position: {
    type: String,
    default: 'Member'
  },
  profileImage: {
    type: String,
    default: null
  },
  profileTitle: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  parish: {
    type: String,
    default: ''
  },
  requestedRole: {
    type: String,
    enum: ['member', 'president'],
    default: 'member'
  },
  requestedParish: {
    type: String,
    default: ''
  },
  permissions: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    add: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    suspend: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  yearCommissioned: {
    type: Number,
    required: false,
    default: null
  },
  executiveSessionStart: {
    type: Number,
    default: null
  },
  executiveSessionEnd: {
    type: Number,
    default: null
  },
  isCurrentExecutiveSession: {
    type: Boolean,
    default: false
  },
  isFeaturedOnHomepage: {
    type: Boolean,
    default: false
  },
  homepageOrder: {
    type: Number,
    default: 0
  }
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return enteredPassword === this.password;
};

const User = mongoose.model('User', UserSchema);

export default User;