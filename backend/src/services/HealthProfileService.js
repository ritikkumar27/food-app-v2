const { BMI_CATEGORIES } = require('../config/constants');

class HealthProfileService {
  /**
   * Calculate BMI from weight (kg) and height (cm)
   * BMI = weight / (height_in_meters)^2
   */
  static calculateBMI(weight, height) {
    if (!weight || !height || height <= 0) return { bmi: null, category: null };

    const heightInMeters = height / 100;
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

    let category = 'normal';
    for (const [cat, range] of Object.entries(BMI_CATEGORIES)) {
      if (bmi >= range.min && bmi < range.max) {
        category = cat;
        break;
      }
    }

    return { bmi, category };
  }

  /**
   * Extract disease flags from user profile for the intelligence engine
   */
  static getDiseaseFlags(profile) {
    const diseases = profile?.diseases || [];
    return {
      hasDiabetes: diseases.includes('diabetes'),
      hasHypertension: diseases.includes('hypertension'),
      hasHeartDisease: diseases.includes('heart_disease'),
      hasKidneyDisease: diseases.includes('kidney_disease'),
      diseaseList: diseases,
      hasAnyDisease: diseases.length > 0,
    };
  }

  /**
   * Get the strictest threshold profile based on user's diseases
   * If user has multiple diseases, pick the strictest limit for each nutrient
   */
  static getActiveProfiles(diseases) {
    if (!diseases || diseases.length === 0) return ['healthy'];
    return diseases;
  }
}

module.exports = HealthProfileService;
