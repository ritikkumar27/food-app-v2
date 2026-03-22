const OpenFoodFactsService = require('../services/OpenFoodFactsService');

/**
 * GET /food/barcode/:code
 */
const getByBarcode = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code || code.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid barcode.',
      });
    }

    const result = await OpenFoodFactsService.fetchByBarcode(code);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Product not found. Try searching by name instead.',
      });
    }

    res.json({
      success: true,
      data: {
        source: result.source,
        product: result.product,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /food/search?q=product_name&page=1
 */
const search = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.',
      });
    }

    const result = await OpenFoodFactsService.searchProducts(q.trim(), parseInt(page));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getByBarcode, search };
