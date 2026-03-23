const mongoose = require('mongoose');

const consumptionLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  barcode: {
    type: String,
    required: true,
    index: true,
  },
  quantity: {
    type: Number, // in grams
    required: true,
    min: 0,
  },
  macros: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  consumedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ConsumptionLog', consumptionLogSchema);
