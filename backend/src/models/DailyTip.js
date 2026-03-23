const mongoose = require('mongoose');

const dailyTipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  tip: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'Nutrition',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One tip per user per day
dailyTipSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyTip', dailyTipSchema);
