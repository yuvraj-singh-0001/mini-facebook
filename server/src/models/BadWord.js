const mongoose = require('mongoose');

const badWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    enum: ['adult_content', 'abusive_and_slangs', 'english_curses', 'abuse', 'harassment', 'sexual', 'bullying', 'hate_speech', 'threat', 'spam']
  }
}, { timestamps: true });

module.exports = mongoose.model('BadWord', badWordSchema);
