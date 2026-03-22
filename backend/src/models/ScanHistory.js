const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  barcode: { type: String, required: true },
  productName: { type: String, default: 'Unknown Product' },
  imageUrl: { type: String, default: '' },
  riskLevel: {
    type: String,
    enum: ['safe', 'moderate', 'high_risk'],
    required: true,
  },
  riskScore: { type: Number, required: true },
  result: { type: mongoose.Schema.Types.Mixed },  // Full analysis result
  scannedAt: { type: Date, default: Date.now },
});

// Index for fast per-user queries, sorted by recency
scanHistorySchema.index({ userId: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanHistory', scanHistorySchema);
