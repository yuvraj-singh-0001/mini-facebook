const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  emailOrPhone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  dobDay: { type: String },
  dobMonth: { type: String },
  dobYear: { type: String },
  gender: { type: String },
  avatar: {
    type: String,
    default: ''
  },
  bio: { type: String, maxlength: 101, default: '' },
  workplace: { type: String, default: '' },
  education: { type: String, default: '' },
  location: { type: String, default: '' },
  hometown: { type: String, default: '' },
  relationshipStatus: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isPublicProfile: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeactivated: { type: Boolean, default: false },
  deactivatedUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
