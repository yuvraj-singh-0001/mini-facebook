const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  image: {
    type: String, // Base64 or URL
    default: ''
  },
  video: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    default: 'post'
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharesCount: {
    type: Number,
    default: 0
  },
  editedAt: {
    type: Date,
    default: null
  },
  isOfficial: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for fast fetching
postSchema.index({ isOfficial: -1, createdAt: -1 }); // Global feed prioritizes official posts
postSchema.index({ createdAt: -1 }); // Global feed backup
postSchema.index({ user: 1, createdAt: -1 }); // Profile feed
postSchema.index({ user: 1, isOfficial: -1, createdAt: -1 }); // Friend feed
postSchema.index({ mediaType: 1, createdAt: -1 }); // Reels feed - fast filter by mediaType
postSchema.index({ mediaType: 1, isOfficial: -1, createdAt: -1 }); // Reels sorted feed
postSchema.index({ video: 1 }); // Reels feed - fast filter by video field

module.exports = mongoose.model('Post', postSchema);
