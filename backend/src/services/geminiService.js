const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  getApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  async fetchProductFallback(barcode) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return null;
    }

    const prompt = `
You are an expert nutritionist database system. 
A user scanned a product with barcode: ${barcode}.
If this barcode might belong to a real product, estimate its nutritional details per 100g.
If it's totally unknown or fake, output a reasonable mock food product (e.g. "Mock Snack Bar").

Return ONLY a valid JSON object with the following structure:
{
  "productName": "string",
  "brands": "string",
  "ingredientsList": "string",
  "nutrients": {
    "calories": 0,
    "sugar": 0,
    "salt": 0,
    "sodium": 0,
    "fat": 0,
    "saturatedFat": 0,
    "transFat": 0,
    "protein": 0,
    "fiber": 0,
    "carbohydrates": 0
  },
  "additives": ["string"],
  "novaGroup": 1,
  "nutriScore": "c"
}
`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          }
        },
        { timeout: 15000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Gemini fallback API error:', error.response?.data || error.message);
      return null;
    }
  }

  async parseManualProduct(textInput) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return null;
    }

    const prompt = `
You are an expert nutritionist database system. 
A user has manually entered a description of a food product they want to log: "${textInput}".
If this description refers to a highly unlikely or nonsensical food, or cannot be reasonably parsed as food, return EXACTLY this JSON: {"error": "Invalid food description"}
Otherwise, estimate its nutritional details per 100g as accurately as possible.

Return ONLY a valid JSON object with the following structure:
{
  "productName": "string",
  "brands": "string",
  "ingredientsList": "string",
  "nutrients": {
    "calories": 0,
    "sugar": 0,
    "salt": 0,
    "sodium": 0,
    "fat": 0,
    "saturatedFat": 0,
    "transFat": 0,
    "protein": 0,
    "fiber": 0,
    "carbohydrates": 0
  },
  "additives": ["string"],
  "novaGroup": 1,
  "nutriScore": "c"
}
`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          }
        },
        { timeout: 15000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(responseText);
      if (parsed.error) return null;
      return parsed;
    } catch (error) {
      console.error('Gemini manual parse API error:', error.message);
      return null;
    }
  }

  async analyzeAdditives(ingredientsList, knownAdditives) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set');
      return [];
    }

    const prompt = `
You are an expert toxicologist and nutritionist.
A user wants to know about the additives and preservatives in their food.
Ingredients List: ${ingredientsList || 'None provided'}
Known Additives: ${knownAdditives ? knownAdditives.join(', ') : 'None provided'}

Identify all food additives and preservatives from this data. For each additive, provide its name, its category (e.g., Preservative, Colorant, Sweetener), its risk level ('low', 'moderate', 'high'), possible health effects, and a brief 1-sentence explanation of what it does. Ensure medically reasonable and non-alarmist output. 
Return ONLY a valid JSON array of objects with the exact structure (and no markdown formatting):
[
  {
    "name": "string",
    "category": "string",
    "riskLevel": "low" | "moderate" | "high",
    "healthEffects": "string",
    "explanation": "string"
  }
]
If there are no additives, return an empty array [].
`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        },
        { timeout: 15000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Gemini additive analysis API error:', error.message);
      return [];
    }
  }

  async analyzeConsumption(nutrition, quantity, userProfile) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        harmLevel: 'moderate',
        explanation: 'AI Analysis unavailable due to missing API key.',
        recommendation: 'Monitor your consumption manually.'
      };
    }

    const prompt = `
You are a personalized health analyst.
Analyze the consumption of a food item for a user.

User Profile: ${JSON.stringify(userProfile)}
Food Nutrition (per 100g): ${JSON.stringify(nutrition)}
Consumed Quantity: ${quantity}g

Calculate the actual intake based on the consumed quantity.
Evaluate the health impact considering the user's age, weight, diseases (if any), and goals.

Return ONLY a JSON object with this exact structure:
{
  "harmLevel": "low" | "moderate" | "high",
  "explanation": "Short 2 sentence explanation of the impact.",
  "recommendation": "Short 1 sentence actionable recommendation."
}
`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          }
        },
        { timeout: 15000 }
      );

      const responseText = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Gemini analysis API error:', error.message);
      return {
        harmLevel: 'moderate',
        explanation: 'AI Analysis currently unavailable.',
        recommendation: 'Monitor your consumption manually.'
      };
    }
  }
}

module.exports = new GeminiService();
