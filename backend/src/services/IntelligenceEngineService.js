const {
  NUTRIENT_THRESHOLDS,
  NUTRIENT_WEIGHTS,
  HARMFUL_ADDITIVES,
  PORTION_RULES,
  FREQUENCY_RULES,
  RISK_RANGES,
} = require('../config/constants');
const HealthProfileService = require('./HealthProfileService');

/**
 * IntelligenceEngineService — The CORE of NutriGuard
 * 
 * A rule-based, disease-oriented food risk analysis engine.
 * No ML — pure deterministic logic based on medical nutritional guidelines.
 * 
 * Pipeline:
 *   1. Resolve effective thresholds (strictest across user's diseases)
 *   2. Score each nutrient against thresholds
 *   3. Apply disease-specific weights
 *   4. Detect additive risks
 *   5. Aggregate into overall risk score (0-100)
 *   6. Generate recommendations & explanations
 */
class IntelligenceEngineService {

  // ════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT
  // ════════════════════════════════════════════════════════════════════

  /**
   * Analyze a food product against a user's health profile
   * 
   * @param {Object} food - Normalized food product (from OpenFoodFactsService)
   * @param {Object} userProfile - User's profile with diseases, age, bmi, etc.
   * @returns {Object} Complete analysis result
   */
  static analyzeFood(food, userProfile) {
    const nutrients = food.nutrients || {};
    const diseases = userProfile?.diseases || [];
    const activeProfiles = HealthProfileService.getActiveProfiles(diseases);

    // 1. Resolve the strictest thresholds across all user diseases
    const effectiveThresholds = this.resolveThresholds(activeProfiles);

    // 2. Score each nutrient
    const nutrientScores = this.scoreNutrients(nutrients, effectiveThresholds);

    // 3. Apply disease-specific weights and calculate raw score
    const weightedScore = this.calculateWeightedScore(nutrientScores, activeProfiles);

    // 4. Detect additive risks  
    const additiveFlags = this.analyzeAdditives(food.additives || []);

    // 5. Check processing level
    const isUltraProcessed = food.novaGroup === 4;

    // 6. Calculate additive penalty
    const additivePenalty = this.calculateAdditivePenalty(additiveFlags, isUltraProcessed);

    // 7. Final risk score (clamped 0-100)
    const riskScore = Math.min(100, Math.max(0, Math.round(weightedScore + additivePenalty)));

    // 8. Determine risk level
    const riskLevel = this.getRiskLevel(riskScore);

    // 9. Generate disease-specific warnings
    const warnings = this.generateWarnings(nutrients, nutrientScores, diseases, additiveFlags, isUltraProcessed);

    // 10. Generate recommendations
    const portionRecommendation = this.generatePortionRecommendation(riskLevel, riskScore);
    const frequencyRecommendation = this.generateFrequencyRecommendation(riskLevel);

    // 11. Generate human-readable explanation
    const explanation = this.generateExplanation(food, nutrients, riskLevel, riskScore, diseases, nutrientScores, warnings);

    // 12. Build nutrient breakdown for UI
    const nutrientBreakdown = this.buildNutrientBreakdown(nutrients, nutrientScores);

    return {
      riskLevel,
      riskScore,
      explanation,
      portionRecommendation,
      frequencyRecommendation,
      warnings,
      nutrientBreakdown,
      additiveFlags,
      isUltraProcessed,
      novaGroup: food.novaGroup,
      nutriScore: food.nutriScore,
      productInfo: {
        name: food.productName,
        brands: food.brands,
        imageUrl: food.imageUrl,
        barcode: food.barcode,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // THRESHOLD RESOLUTION
  // ════════════════════════════════════════════════════════════════════

  /**
   * Resolve the strictest thresholds across all active disease profiles.
   * For each nutrient, pick the LOWEST moderate and high values.
   */
  static resolveThresholds(activeProfiles) {
    const resolved = {};
    const nutrientKeys = Object.keys(NUTRIENT_THRESHOLDS.healthy);

    for (const nutrientKey of nutrientKeys) {
      let strictestModerate = null;
      let strictestHigh = null;

      for (const profile of activeProfiles) {
        const thresholds = NUTRIENT_THRESHOLDS[profile]?.[nutrientKey];
        if (!thresholds) continue;

        if (thresholds.moderate !== null) {
          if (strictestModerate === null || thresholds.moderate < strictestModerate) {
            strictestModerate = thresholds.moderate;
          }
        }

        if (thresholds.high !== null) {
          if (strictestHigh === null || thresholds.high < strictestHigh) {
            strictestHigh = thresholds.high;
          }
        }
      }

      resolved[nutrientKey] = {
        moderate: strictestModerate,
        high: strictestHigh,
      };
    }

    return resolved;
  }

  // ════════════════════════════════════════════════════════════════════
  // NUTRIENT SCORING
  // ════════════════════════════════════════════════════════════════════

  /**
   * Score each nutrient: 0 = safe, 1 = moderate, 2 = high risk
   * Also stores the raw value and threshold for explanation purposes
   */
  static scoreNutrients(nutrients, thresholds) {
    const scores = {};

    const nutrientMap = {
      sugar:       { value: nutrients.sugar,       unit: 'g' },
      sodium:      { value: nutrients.sodium,      unit: 'mg' },
      fat:         { value: nutrients.fat,         unit: 'g' },
      saturatedFat:{ value: nutrients.saturatedFat, unit: 'g' },
      transFat:    { value: nutrients.transFat,    unit: 'g' },
      protein:     { value: nutrients.protein,     unit: 'g' },
      calories:    { value: nutrients.calories,    unit: 'kcal' },
    };

    for (const [key, { value, unit }] of Object.entries(nutrientMap)) {
      const threshold = thresholds[key];
      
      if (value == null || !threshold || (threshold.moderate == null && threshold.high == null)) {
        scores[key] = { score: 0, status: 'unknown', value: null, unit, threshold };
        continue;
      }

      let score = 0;
      let status = 'safe';

      if (threshold.high != null && value >= threshold.high) {
        score = 2;
        status = 'high_risk';
      } else if (threshold.moderate != null && value >= threshold.moderate) {
        score = 1;
        status = 'moderate';
      }

      scores[key] = { score, status, value, unit, threshold };
    }

    return scores;
  }

  // ════════════════════════════════════════════════════════════════════
  // WEIGHTED SCORE CALCULATION
  // ════════════════════════════════════════════════════════════════════

  /**
   * Apply disease-specific weights and compute overall score (0-100)
   */
  static calculateWeightedScore(nutrientScores, activeProfiles) {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Merge weights across all active profiles (use max weight for each nutrient)
    const mergedWeights = {};
    for (const profile of activeProfiles) {
      const weights = NUTRIENT_WEIGHTS[profile] || NUTRIENT_WEIGHTS.healthy;
      for (const [nutrient, weight] of Object.entries(weights)) {
        if (!mergedWeights[nutrient] || weight > mergedWeights[nutrient]) {
          mergedWeights[nutrient] = weight;
        }
      }
    }

    for (const [nutrient, data] of Object.entries(nutrientScores)) {
      if (data.status === 'unknown') continue;

      const weight = mergedWeights[nutrient] || 1.0;
      totalWeightedScore += data.score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    // Normalize: max possible raw score = 2 * totalWeight
    // Map to 0-100 scale
    const maxPossibleScore = 2 * totalWeight;
    const normalizedScore = (totalWeightedScore / maxPossibleScore) * 100;

    return normalizedScore;
  }

  // ════════════════════════════════════════════════════════════════════
  // ADDITIVE ANALYSIS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Analyze additives against the harmful additives blacklist
   */
  static analyzeAdditives(additives) {
    const flags = [];

    for (const additive of additives) {
      const key = additive.toLowerCase();
      if (HARMFUL_ADDITIVES[key]) {
        flags.push({
          code: additive,
          ...HARMFUL_ADDITIVES[key],
        });
      }
    }

    return flags;
  }

  /**
   * Calculate additional penalty from additives and processing level
   */
  static calculateAdditivePenalty(additiveFlags, isUltraProcessed) {
    let penalty = 0;

    // Each harmful additive adds to the penalty
    for (const flag of additiveFlags) {
      switch (flag.risk) {
        case 'high':     penalty += 5; break;
        case 'moderate': penalty += 3; break;
        case 'low':      penalty += 1; break;
      }
    }

    // Ultra-processed food penalty
    if (isUltraProcessed) {
      penalty += 8;
    }

    // Cap additive penalty at 20 points
    return Math.min(20, penalty);
  }

  // ════════════════════════════════════════════════════════════════════
  // RISK LEVEL CLASSIFICATION
  // ════════════════════════════════════════════════════════════════════

  static getRiskLevel(riskScore) {
    if (riskScore <= RISK_RANGES.safe.max) return 'safe';
    if (riskScore <= RISK_RANGES.moderate.max) return 'moderate';
    return 'high_risk';
  }

  // ════════════════════════════════════════════════════════════════════
  // WARNING GENERATION
  // ════════════════════════════════════════════════════════════════════

  /**
   * Generate disease-specific and additive warnings
   */
  static generateWarnings(nutrients, nutrientScores, diseases, additiveFlags, isUltraProcessed) {
    const warnings = [];

    // Disease-specific nutrient warnings
    const diseaseNutrientMap = {
      diabetes:       { nutrients: ['sugar', 'calories'],          label: 'diabetes' },
      hypertension:   { nutrients: ['sodium'],                     label: 'hypertension' },
      heart_disease:  { nutrients: ['fat', 'saturatedFat', 'transFat', 'sodium'], label: 'heart disease' },
      kidney_disease: { nutrients: ['protein', 'sodium'],          label: 'kidney disease' },
    };

    for (const disease of diseases) {
      const mapping = diseaseNutrientMap[disease];
      if (!mapping) continue;

      for (const nutrient of mapping.nutrients) {
        const score = nutrientScores[nutrient];
        if (!score || score.status === 'safe' || score.status === 'unknown') continue;

        const severity = score.status === 'high_risk' ? 'High' : 'Elevated';
        const nutrientLabel = this.getNutrientLabel(nutrient);
        const valueStr = score.value != null ? ` (${score.value}${score.unit}/100g)` : '';

        warnings.push({
          type: 'disease',
          disease: mapping.label,
          nutrient,
          severity: score.status,
          message: `${severity} ${nutrientLabel}${valueStr} — not suitable for ${mapping.label}`,
        });
      }
    }

    // If user has no diseases but nutrients are still flagged, show general warnings
    if (diseases.length === 0) {
      for (const [nutrient, score] of Object.entries(nutrientScores)) {
        if (score.status === 'high_risk') {
          const nutrientLabel = this.getNutrientLabel(nutrient);
          const valueStr = score.value != null ? ` (${score.value}${score.unit}/100g)` : '';

          warnings.push({
            type: 'general',
            nutrient,
            severity: 'high_risk',
            message: `High ${nutrientLabel}${valueStr} — consume in moderation`,
          });
        }
      }
    }

    // Additive warnings
    for (const flag of additiveFlags) {
      warnings.push({
        type: 'additive',
        additive: flag.code,
        name: flag.name,
        severity: flag.risk,
        message: `Contains ${flag.name} (${flag.code.replace('en:', '').toUpperCase()}) — ${flag.concern}`,
      });
    }

    // Ultra-processed warning
    if (isUltraProcessed) {
      warnings.push({
        type: 'processing',
        severity: 'high_risk',
        message: 'Ultra-processed food (NOVA 4) — regular consumption linked to increased health risks',
      });
    }

    return warnings;
  }

  // ════════════════════════════════════════════════════════════════════
  // RECOMMENDATION GENERATION
  // ════════════════════════════════════════════════════════════════════

  static generatePortionRecommendation(riskLevel, riskScore) {
    const rule = PORTION_RULES[riskLevel];

    // Refine based on score within range
    if (riskLevel === 'moderate') {
      if (riskScore > 50) {
        return { grams: 30, label: 'Limit to 30g per serving' };
      }
      return rule;
    }

    if (riskLevel === 'high_risk') {
      if (riskScore > 80) {
        return { grams: null, label: 'Strongly recommended to avoid this product' };
      }
      return rule;
    }

    return rule;
  }

  static generateFrequencyRecommendation(riskLevel) {
    return FREQUENCY_RULES[riskLevel];
  }

  // ════════════════════════════════════════════════════════════════════
  // EXPLANATION GENERATION
  // ════════════════════════════════════════════════════════════════════

  /**
   * Generate a human-readable explanation of WHY the food was classified this way
   */
  static generateExplanation(food, nutrients, riskLevel, riskScore, diseases, nutrientScores, warnings) {
    const parts = [];
    const productName = food.productName || 'This product';

    // Opening statement
    if (riskLevel === 'safe') {
      parts.push(`${productName} is generally safe for your health profile.`);
    } else if (riskLevel === 'moderate') {
      parts.push(`${productName} should be consumed with caution based on your health profile.`);
    } else {
      parts.push(`${productName} poses significant health risks based on your health profile.`);
    }

    // Disease-specific explanation
    const diseaseWarnings = warnings.filter(w => w.type === 'disease');
    if (diseaseWarnings.length > 0) {
      const diseaseNames = [...new Set(diseaseWarnings.map(w => w.disease))];
      parts.push(
        `Given your condition${diseaseNames.length > 1 ? 's' : ''} (${diseaseNames.join(', ')}), ` +
        `certain nutrients in this product exceed recommended limits.`
      );

      // Detail the worst offenders
      const highRiskWarnings = diseaseWarnings.filter(w => w.severity === 'high_risk');
      if (highRiskWarnings.length > 0) {
        const details = highRiskWarnings.map(w => {
          const score = nutrientScores[w.nutrient];
          return `${this.getNutrientLabel(w.nutrient)} is ${score?.value}${score?.unit}/100g ` +
                 `(limit: ${score?.threshold?.high}${score?.unit})`;
        });
        parts.push(`Key concerns: ${details.join('; ')}.`);
      }
    }

    // Additive explanation
    const additiveWarnings = warnings.filter(w => w.type === 'additive' && w.severity === 'high');
    if (additiveWarnings.length > 0) {
      parts.push(
        `This product contains ${additiveWarnings.length} concerning additive${additiveWarnings.length > 1 ? 's' : ''} ` +
        `that may affect your health.`
      );
    }

    // Processing level
    if (food.novaGroup === 4) {
      parts.push(
        'This is an ultra-processed food (NOVA Group 4). ' +
        'Regular consumption of ultra-processed foods is associated with increased health risks.'
      );
    }

    // General nutrient note for healthy users
    if (diseases.length === 0 && riskLevel !== 'safe') {
      const highNutrients = Object.entries(nutrientScores)
        .filter(([, s]) => s.status === 'high_risk')
        .map(([key]) => this.getNutrientLabel(key));

      if (highNutrients.length > 0) {
        parts.push(
          `Even without specific health conditions, this product has high levels of ` +
          `${highNutrients.join(', ')}, which should be limited in a healthy diet.`
        );
      }
    }

    return parts.join(' ');
  }

  // ════════════════════════════════════════════════════════════════════
  // NUTRIENT BREAKDOWN (for UI)
  // ════════════════════════════════════════════════════════════════════

  static buildNutrientBreakdown(nutrients, nutrientScores) {
    const breakdown = {};

    const allNutrients = {
      calories:     { label: 'Calories',       unit: 'kcal' },
      sugar:        { label: 'Sugar',          unit: 'g' },
      sodium:       { label: 'Sodium',         unit: 'mg' },
      fat:          { label: 'Total Fat',      unit: 'g' },
      saturatedFat: { label: 'Saturated Fat',  unit: 'g' },
      transFat:     { label: 'Trans Fat',      unit: 'g' },
      protein:      { label: 'Protein',        unit: 'g' },
      fiber:        { label: 'Fiber',          unit: 'g' },
      carbohydrates:{ label: 'Carbohydrates',  unit: 'g' },
      salt:         { label: 'Salt',           unit: 'g' },
    };

    for (const [key, meta] of Object.entries(allNutrients)) {
      const score = nutrientScores[key];
      breakdown[key] = {
        label: meta.label,
        value: nutrients[key],
        unit: meta.unit,
        status: score?.status || 'unknown',
        perServing: 'per 100g',
      };
    }

    return breakdown;
  }

  // ════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════

  static getNutrientLabel(key) {
    const labels = {
      sugar: 'sugar',
      sodium: 'sodium',
      fat: 'fat',
      saturatedFat: 'saturated fat',
      transFat: 'trans fat',
      protein: 'protein',
      calories: 'calories',
      fiber: 'fiber',
    };
    return labels[key] || key;
  }
}

module.exports = IntelligenceEngineService;
