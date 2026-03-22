/**
 * NutriGuard — Centralized Constants & Threshold Configuration
 * 
 * This file defines all disease-specific nutrient thresholds,
 * additive blacklists, and recommendation rules used by the
 * Intelligence Engine.
 */

// ─── NUTRIENT THRESHOLDS (per 100g) ─────────────────────────────────
// Each nutrient has a "moderate" and "high" cutoff.
// Values below moderate = SAFE, between moderate and high = MODERATE, above high = HIGH RISK

const NUTRIENT_THRESHOLDS = {
  healthy: {
    sugar:       { moderate: 15,  high: 22.5 },
    sodium:      { moderate: 400, high: 600  },  // mg
    fat:         { moderate: 15,  high: 20   },
    saturatedFat:{ moderate: 5,   high: 10   },
    transFat:    { moderate: 1,   high: 2    },
    protein:     { moderate: null, high: null }, // no limit for healthy
    fiber:       { moderate: null, high: null }, // more is better
    calories:    { moderate: 300, high: 500  },
  },

  diabetes: {
    sugar:       { moderate: 8,   high: 12   }, // much stricter
    sodium:      { moderate: 400, high: 600  },
    fat:         { moderate: 15,  high: 20   },
    saturatedFat:{ moderate: 5,   high: 10   },
    transFat:    { moderate: 1,   high: 2    },
    protein:     { moderate: null, high: null },
    fiber:       { moderate: null, high: null },
    calories:    { moderate: 250, high: 400  },
  },

  hypertension: {
    sugar:       { moderate: 15,  high: 22.5 },
    sodium:      { moderate: 200, high: 300  }, // much stricter
    fat:         { moderate: 15,  high: 20   },
    saturatedFat:{ moderate: 5,   high: 10   },
    transFat:    { moderate: 1,   high: 2    },
    protein:     { moderate: null, high: null },
    fiber:       { moderate: null, high: null },
    calories:    { moderate: 300, high: 500  },
  },

  heart_disease: {
    sugar:       { moderate: 15,  high: 22.5 },
    sodium:      { moderate: 300, high: 500  }, // stricter
    fat:         { moderate: 10,  high: 15   }, // stricter
    saturatedFat:{ moderate: 3,   high: 5    }, // much stricter
    transFat:    { moderate: 0.5, high: 1    }, // very strict
    protein:     { moderate: null, high: null },
    fiber:       { moderate: null, high: null },
    calories:    { moderate: 250, high: 400  },
  },

  kidney_disease: {
    sugar:       { moderate: 15,  high: 22.5 },
    sodium:      { moderate: 200, high: 300  }, // stricter
    fat:         { moderate: 15,  high: 20   },
    saturatedFat:{ moderate: 5,   high: 10   },
    transFat:    { moderate: 1,   high: 2    },
    protein:     { moderate: 8,   high: 12   }, // protein restricted
    fiber:       { moderate: null, high: null },
    calories:    { moderate: 300, high: 500  },
  },
};

// ─── NUTRIENT WEIGHTS PER DISEASE ────────────────────────────────────
// How much each nutrient matters for scoring per disease

const NUTRIENT_WEIGHTS = {
  healthy: {
    sugar: 1.0, sodium: 1.0, fat: 1.0, saturatedFat: 1.0,
    transFat: 1.0, protein: 0, calories: 0.8,
  },
  diabetes: {
    sugar: 2.0, sodium: 1.0, fat: 1.0, saturatedFat: 1.0,
    transFat: 1.0, protein: 0, calories: 1.2,
  },
  hypertension: {
    sugar: 1.0, sodium: 2.0, fat: 1.0, saturatedFat: 1.0,
    transFat: 1.0, protein: 0, calories: 0.8,
  },
  heart_disease: {
    sugar: 1.0, sodium: 1.5, fat: 1.8, saturatedFat: 2.0,
    transFat: 2.0, protein: 0, calories: 1.0,
  },
  kidney_disease: {
    sugar: 1.0, sodium: 1.8, fat: 1.0, saturatedFat: 1.0,
    transFat: 1.0, protein: 2.0, calories: 0.8,
  },
};

// ─── HARMFUL ADDITIVES ───────────────────────────────────────────────

const HARMFUL_ADDITIVES = {
  'en:e102':  { name: 'Tartrazine', risk: 'high', concern: 'Linked to hyperactivity, allergic reactions' },
  'en:e110':  { name: 'Sunset Yellow', risk: 'high', concern: 'May cause allergic reactions, hyperactivity' },
  'en:e120':  { name: 'Carmine', risk: 'moderate', concern: 'Allergic reactions in sensitive individuals' },
  'en:e122':  { name: 'Carmoisine', risk: 'high', concern: 'Linked to hyperactivity in children' },
  'en:e124':  { name: 'Ponceau 4R', risk: 'high', concern: 'Potential carcinogen, hyperactivity' },
  'en:e129':  { name: 'Allura Red', risk: 'high', concern: 'Linked to hyperactivity' },
  'en:e150d': { name: 'Caramel Color IV', risk: 'moderate', concern: 'Contains 4-MEI, potential carcinogen' },
  'en:e211':  { name: 'Sodium Benzoate', risk: 'high', concern: 'May form benzene with vitamin C, hyperactivity' },
  'en:e220':  { name: 'Sulfur Dioxide', risk: 'moderate', concern: 'Can trigger asthma, allergic reactions' },
  'en:e250':  { name: 'Sodium Nitrite', risk: 'high', concern: 'Forms carcinogenic nitrosamines' },
  'en:e251':  { name: 'Sodium Nitrate', risk: 'high', concern: 'Forms carcinogenic nitrosamines' },
  'en:e320':  { name: 'BHA', risk: 'high', concern: 'Possible carcinogen (IARC Group 2B)' },
  'en:e321':  { name: 'BHT', risk: 'moderate', concern: 'Potential endocrine disruptor' },
  'en:e385':  { name: 'EDTA', risk: 'moderate', concern: 'May affect mineral absorption' },
  'en:e420':  { name: 'Sorbitol', risk: 'low', concern: 'Laxative effect in large amounts' },
  'en:e621':  { name: 'MSG', risk: 'moderate', concern: 'May cause headaches, affects blood pressure' },
  'en:e627':  { name: 'Disodium Guanylate', risk: 'moderate', concern: 'Should be avoided with gout/kidney issues' },
  'en:e631':  { name: 'Disodium Inosinate', risk: 'moderate', concern: 'Should be avoided with gout/kidney issues' },
  'en:e900':  { name: 'Dimethylpolysiloxane', risk: 'low', concern: 'Anti-foaming agent, minimal studies' },
  'en:e950':  { name: 'Acesulfame K', risk: 'moderate', concern: 'Artificial sweetener, debated safety' },
  'en:e951':  { name: 'Aspartame', risk: 'moderate', concern: 'Artificial sweetener, IARC Group 2B' },
  'en:e952':  { name: 'Cyclamate', risk: 'high', concern: 'Banned in some countries, potential carcinogen' },
  'en:e955':  { name: 'Sucralose', risk: 'low', concern: 'May affect gut microbiome' },
  'en:e960':  { name: 'Stevia', risk: 'low', concern: 'Generally recognized as safe' },
  'en:e1442': { name: 'Hydroxypropyl Distarch Phosphate', risk: 'low', concern: 'Modified starch, generally safe' },
};

// ─── PORTION RECOMMENDATIONS ─────────────────────────────────────────

const PORTION_RULES = {
  safe:      { grams: null, label: 'Standard serving size as labeled' },
  moderate:  { grams: 50,   label: 'Limit to 50g per serving' },
  high_risk: { grams: 25,   label: 'Avoid or limit to 25g maximum' },
};

// ─── FREQUENCY RECOMMENDATIONS ───────────────────────────────────────

const FREQUENCY_RULES = {
  safe:      { label: 'Can be consumed daily in moderate amounts' },
  moderate:  { label: 'Limit to 2–3 times per week' },
  high_risk: { label: 'Maximum once per week, or avoid entirely' },
};

// ─── RISK SCORE RANGES ──────────────────────────────────────────────

const RISK_RANGES = {
  safe:      { min: 0,  max: 30  },
  moderate:  { min: 31, max: 60  },
  high_risk: { min: 61, max: 100 },
};

// ─── BMI CATEGORIES ──────────────────────────────────────────────────

const BMI_CATEGORIES = {
  underweight: { min: 0, max: 18.5 },
  normal:      { min: 18.5, max: 25 },
  overweight:  { min: 25, max: 30 },
  obese:       { min: 30, max: Infinity },
};

module.exports = {
  NUTRIENT_THRESHOLDS,
  NUTRIENT_WEIGHTS,
  HARMFUL_ADDITIVES,
  PORTION_RULES,
  FREQUENCY_RULES,
  RISK_RANGES,
  BMI_CATEGORIES,
};
