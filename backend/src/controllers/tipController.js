const DailyTip = require('../models/DailyTip');
const ConsumptionLog = require('../models/ConsumptionLog');
const FoodCache = require('../models/FoodCache');
const geminiService = require('../services/geminiService');

const FALLBACK_TIPS = [
  { tip: 'Drink at least 8 glasses of water today.', explanation: 'Staying hydrated helps your body absorb nutrients and maintain energy levels throughout the day.', category: 'Hydration' },
  { tip: 'Include a serving of vegetables with your next meal.', explanation: 'Vegetables are rich in fiber, vitamins, and minerals that support your overall health and digestion.', category: 'Nutrition' },
  { tip: 'Take a 10-minute walk after your largest meal.', explanation: 'Post-meal walking helps regulate blood sugar levels and improves digestion.', category: 'Exercise' },
  { tip: 'Try to eat your dinner at least 2 hours before bed.', explanation: 'Late-night eating can disrupt sleep quality and may contribute to weight gain over time.', category: 'Mindful Eating' },
  { tip: 'Swap one sugary drink for water or herbal tea today.', explanation: 'Reducing liquid sugar intake is one of the most impactful changes for metabolic health.', category: 'Balance' },
];

const getDailyTip = async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Check cache — one tip per user per day
    const cached = await DailyTip.findOne({ userId, date: today });
    if (cached) {
      return res.json({
        success: true,
        data: {
          tip: cached.tip,
          explanation: cached.explanation,
          category: cached.category,
          cached: true,
        },
      });
    }

    // 2. Aggregate last 7 days of consumption
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await ConsumptionLog.find({
      user: userId,
      consumedAt: { $gte: sevenDaysAgo },
    });

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    const barcodeCounts = {};

    logs.forEach((log) => {
      totalCalories += log.macros?.calories || 0;
      totalProtein += log.macros?.protein || 0;
      totalCarbs += log.macros?.carbs || 0;
      totalFat += log.macros?.fat || 0;
      barcodeCounts[log.barcode] = (barcodeCounts[log.barcode] || 0) + 1;
    });

    const daysActive = Math.max(1, new Set(logs.map(l => new Date(l.consumedAt).toISOString().split('T')[0])).size);

    // Find top 3 most consumed foods
    const topBarcodes = Object.entries(barcodeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([bc]) => bc);

    let topFoodsStr = 'None tracked';
    if (topBarcodes.length > 0) {
      const topFoods = await FoodCache.find({ barcode: { $in: topBarcodes } }).select('productName').lean();
      topFoodsStr = topFoods.map(f => f.productName).join(', ') || 'None tracked';
    }

    const consumptionSummary = {
      avgCalories: Math.round(totalCalories / daysActive),
      avgProtein: Math.round(totalProtein / daysActive),
      avgCarbs: Math.round(totalCarbs / daysActive),
      avgFat: Math.round(totalFat / daysActive),
      totalLogs: logs.length,
      topFoods: topFoodsStr,
    };

    const userProfile = req.user?.profile || {};

    // 3. Call Gemini
    const geminiTip = await geminiService.generateDailyTip(consumptionSummary, userProfile);

    let tipData;
    if (geminiTip && geminiTip.tip) {
      tipData = {
        tip: geminiTip.tip,
        explanation: geminiTip.explanation || '',
        category: geminiTip.category || 'Nutrition',
      };
    } else {
      // Fallback: pick a random generic tip
      const fallback = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      tipData = { ...fallback };
    }

    // 4. Save to DB (upsert to handle race conditions)
    await DailyTip.findOneAndUpdate(
      { userId, date: today },
      { userId, date: today, ...tipData },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        ...tipData,
        cached: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDailyTip };
