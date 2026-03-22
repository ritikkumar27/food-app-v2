const OpenFoodFactsService = require('../services/OpenFoodFactsService');
const IntelligenceEngineService = require('../services/IntelligenceEngineService');
const ScanHistory = require('../models/ScanHistory');

/**
 * POST /analyze
 * Body: { barcode } or { foodData }
 */
const analyze = async (req, res, next) => {
  try {
    const { barcode, foodData } = req.body;
    const userProfile = req.user?.profile || {};

    let food;

    if (barcode) {
      // Fetch food by barcode
      const result = await OpenFoodFactsService.fetchByBarcode(barcode);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Product not found for this barcode.',
        });
      }
      food = result.product;
    } else if (foodData) {
      // Use provided food data directly (for testing or manual entry)
      food = foodData;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide a barcode or food data.',
      });
    }

    // Run the intelligence engine
    const analysis = IntelligenceEngineService.analyzeFood(food, userProfile);

    // Save to scan history
    await ScanHistory.create({
      userId: req.userId,
      barcode: food.barcode || barcode || 'manual',
      productName: food.productName || 'Unknown',
      imageUrl: food.imageUrl || '',
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore,
      result: analysis,
    });

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /history?limit=20&page=1
 */
const getHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [history, total] = await Promise.all([
      ScanHistory.find({ userId: req.userId })
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ScanHistory.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyze, getHistory };
