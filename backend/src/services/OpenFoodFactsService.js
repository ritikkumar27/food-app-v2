const axios = require('axios');
const FoodCache = require('../models/FoodCache');

const OFF_BASE = process.env.OFF_BASE_URL || 'https://world.openfoodfacts.org';
const USER_AGENT = 'NutriGuard/1.0 (contact@nutriguard.app)';

class OpenFoodFactsService {
  /**
   * Fetch a product by barcode
   * Checks cache first, then calls Open Food Facts API
   */
  static async fetchByBarcode(barcode) {
    // 1. Check cache
    const cached = await FoodCache.findOne({ barcode });
    if (cached) {
      return { source: 'cache', product: cached.toObject() };
    }

    // 2. Fetch from Open Food Facts
    const url = `${OFF_BASE}/api/v2/product/${barcode}`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    if (!response.data || response.data.status !== 1) {
      return null; // Product not found
    }

    const rawProduct = response.data.product;

    // 3. Normalize
    const normalized = this.normalizeProduct(barcode, rawProduct);

    // 4. Cache
    const cachedProduct = await FoodCache.findOneAndUpdate(
      { barcode },
      normalized,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { source: 'api', product: cachedProduct.toObject() };
  }

  /**
   * Search products by name
   */
  static async searchProducts(query, page = 1, pageSize = 20) {
    const url = `${OFF_BASE}/cgi/search.pl`;
    const response = await axios.get(url, {
      params: {
        search_terms: query,
        json: 1,
        page,
        page_size: pageSize,
        fields: 'code,product_name,brands,image_front_small_url,nutriments,nutriscore_grade,nova_group',
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    if (!response.data || !response.data.products) {
      return { products: [], count: 0 };
    }

    const products = response.data.products.map((p) => ({
      barcode: p.code,
      productName: p.product_name || 'Unknown Product',
      brands: p.brands || '',
      imageUrl: p.image_front_small_url || '',
      nutriScore: p.nutriscore_grade || null,
      novaGroup: p.nova_group || null,
      hasNutrients: !!(p.nutriments && Object.keys(p.nutriments).length > 0),
    }));

    return {
      products,
      count: response.data.count || products.length,
      page,
      pageSize,
    };
  }

  /**
   * Normalize raw Open Food Facts product data into our schema
   * All nutrients are normalized to per 100g
   */
  static normalizeProduct(barcode, raw) {
    const n = raw.nutriments || {};

    // Extract sodium: prefer direct sodium field, otherwise derive from salt
    let sodium = null;
    if (n.sodium_100g != null) {
      sodium = n.sodium_100g * 1000; // convert g to mg
    } else if (n['sodium_value'] != null) {
      sodium = n['sodium_value'] * (n['sodium_unit'] === 'mg' ? 1 : 1000);
    } else if (n.salt_100g != null) {
      sodium = (n.salt_100g / 2.5) * 1000; // salt to sodium, then g to mg
    }

    // Extract additives
    const additives = raw.additives_tags || [];

    // Extract NOVA group (processing level)
    let novaGroup = null;
    if (raw.nova_group) {
      novaGroup = parseInt(raw.nova_group, 10);
    } else if (raw.nova_groups_tags && raw.nova_groups_tags.length > 0) {
      const tag = raw.nova_groups_tags[0];
      const match = tag.match(/(\d)/);
      if (match) novaGroup = parseInt(match[1], 10);
    }

    return {
      barcode,
      productName: raw.product_name || raw.product_name_en || 'Unknown Product',
      brands: raw.brands || '',
      imageUrl: raw.image_front_url || raw.image_front_small_url || '',
      quantity: raw.quantity || '',
      categories: raw.categories || '',
      ingredientsList: raw.ingredients_text || raw.ingredients_text_en || '',

      nutrients: {
        calories:     this.safeNumber(n['energy-kcal_100g'] || n['energy-kcal']),
        sugar:        this.safeNumber(n.sugars_100g || n.sugars),
        salt:         this.safeNumber(n.salt_100g || n.salt),
        sodium:       sodium != null ? parseFloat(sodium.toFixed(1)) : null,
        fat:          this.safeNumber(n.fat_100g || n.fat),
        saturatedFat: this.safeNumber(n['saturated-fat_100g'] || n['saturated-fat']),
        transFat:     this.safeNumber(n['trans-fat_100g'] || n['trans-fat']),
        protein:      this.safeNumber(n.proteins_100g || n.proteins),
        fiber:        this.safeNumber(n.fiber_100g || n.fiber),
        carbohydrates:this.safeNumber(n.carbohydrates_100g || n.carbohydrates),
      },

      additives,
      novaGroup,
      nutriScore: raw.nutriscore_grade || raw.nutrition_grades || null,

      fetchedAt: new Date(),
    };
  }

  /**
   * Safely parse a number, returning null for invalid/missing values
   */
  static safeNumber(val) {
    if (val == null || val === '' || val === '-') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : parseFloat(num.toFixed(2));
  }
}

module.exports = OpenFoodFactsService;
