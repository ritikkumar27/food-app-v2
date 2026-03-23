const mongoose = require('mongoose');

const foodCacheSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  productName: { type: String, default: 'Unknown Product' },
  brands: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  quantity: { type: String, default: '' },
  source: { type: String, default: 'openfoodfacts' },
  categories: { type: String, default: '' },
  ingredientsList: { type: String, default: '' },

  nutrients: {
    calories:    { type: Number, default: null },  // kcal per 100g
    sugar:       { type: Number, default: null },  // g per 100g
    salt:        { type: Number, default: null },  // g per 100g
    sodium:      { type: Number, default: null },  // mg per 100g
    fat:         { type: Number, default: null },  // g per 100g
    saturatedFat:{ type: Number, default: null },  // g per 100g
    transFat:    { type: Number, default: null },  // g per 100g
    protein:     { type: Number, default: null },  // g per 100g
    fiber:       { type: Number, default: null },  // g per 100g
    carbohydrates:{ type: Number, default: null }, // g per 100g
  },

  additives: [{ type: String }],  // e.g., ['en:e621', 'en:e211']
  additivesDetails: [{
    name: String,
    category: String,
    riskLevel: { type: String, enum: ['low', 'moderate', 'high'] },
    healthEffects: String,
    explanation: String
  }],
  isAdditivesAnalyzed: { type: Boolean, default: false },
  novaGroup: { type: Number, default: null },  // 1-4 (processing level)
  nutriScore: { type: String, default: null }, // a-e

  fetchedAt: {
    type: Date,
    default: Date.now,
    index: { expires: '7d' },  // TTL: auto-delete after 7 days
  },
});

module.exports = mongoose.model('FoodCache', foodCacheSchema);
