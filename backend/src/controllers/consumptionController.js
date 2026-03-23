const ConsumptionLog = require('../models/ConsumptionLog');
const FoodCache = require('../models/FoodCache');
const geminiService = require('../services/geminiService');

const logConsumption = async (req, res, next) => {
  try {
    const { barcode, quantity } = req.body;
    const userId = req.userId; // injected by authMiddleware

    if (!barcode || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid barcode and quantity are required.' });
    }

    const food = await FoodCache.findOne({ barcode });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found in database.' });
    }

    // Calculate macros per quantity (food nutrients are per 100g)
    const multiplier = quantity / 100;
    const calories = (food.nutrients?.calories || 0) * multiplier;
    const protein = (food.nutrients?.protein || 0) * multiplier;
    const carbs = (food.nutrients?.carbohydrates || 0) * multiplier;
    const fat = (food.nutrients?.fat || 0) * multiplier;

    const log = new ConsumptionLog({
      user: userId,
      barcode,
      quantity,
      macros: { calories, protein, carbs, fat },
      consumedAt: new Date()
    });
    await log.save();

    // Call Gemini for impact
    const userProfile = req.user?.profile || {};
    const insight = await geminiService.analyzeConsumption(food.nutrients, quantity, userProfile);

    res.status(201).json({
      success: true,
      data: {
        log,
        insight,
      }
    });

  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Fetch last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await ConsumptionLog.find({
      user: userId,
      consumedAt: { $gte: thirtyDaysAgo }
    }).sort({ consumedAt: 1 });

    // Aggregate daily stats
    const dailyStats = {};
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

    logs.forEach(log => {
      // Create local ISO string date slice
      const dateKey = new Date(log.consumedAt).toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyStats[dateKey].calories += log.macros.calories;
      dailyStats[dateKey].protein += log.macros.protein;
      dailyStats[dateKey].carbs += log.macros.carbs;
      dailyStats[dateKey].fat += log.macros.fat;

      totalCalories += log.macros.calories;
      totalProtein += log.macros.protein;
      totalCarbs += log.macros.carbs;
      totalFat += log.macros.fat;
    });

    // Simple 30-day health score based on balanced macros
    // Target: protein 30%, carbs 45%, fat 25% of calories
    const proteinCals = totalProtein * 4;
    const carbsCals = totalCarbs * 4;
    const fatCals = totalFat * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals || 1;

    const proteinP = proteinCals / totalMacroCals;
    const carbsP = carbsCals / totalMacroCals;
    const fatP = fatCals / totalMacroCals;

    // Deviation from ideal
    let score = 100;
    score -= Math.abs(proteinP - 0.3) * 100;
    score -= Math.abs(carbsP - 0.45) * 100;
    score -= Math.abs(fatP - 0.25) * 100;
    
    score = Math.max(0, Math.round(score));

    // Generate charts
    const chartLabels = Object.keys(dailyStats);
    const chartData = Object.values(dailyStats).map(d => d.calories);

    // Provide at least dummy graph if no logs
    const safeLabels = chartLabels.length ? chartLabels.slice(-7) : ['Mon'];
    const safeData = chartData.length ? chartData.slice(-7) : [0];

    res.json({
      success: true,
      data: {
        score,
        macroDistribution: [
          { name: 'Protein', population: Math.round(totalProtein), color: '#FF6384', legendFontColor: '#7F7F7F', legendFontSize: 12 },
          { name: 'Carbs', population: Math.round(totalCarbs), color: '#36A2EB', legendFontColor: '#7F7F7F', legendFontSize: 12 },
          { name: 'Fat', population: Math.round(totalFat), color: '#FFCE56', legendFontColor: '#7F7F7F', legendFontSize: 12 }
        ],
        dailyCalories: {
          labels: safeLabels,
          data: safeData
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { logConsumption, getAnalytics };
