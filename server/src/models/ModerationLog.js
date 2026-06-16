const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attemptedMessage: {
    type: String,
    required: true
  },
  caughtWords: [{
    type: String
  }],
  caughtCategories: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
