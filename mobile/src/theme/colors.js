/**
 * NutriGuard Color Palette — Light wellness theme
 * Soft, natural, health-oriented palette
 */
const colors = {
  // Background layers
  background: '#F7F5F2',
  surface: '#FFFFFF',
  surfaceLight: '#F0EDE8',
  surfaceElevated: '#FFFFFF',

  // Primary brand — soft sage green
  primary: '#4A9D7C',
  primaryLight: '#6BB89A',
  primaryDark: '#3A7D62',

  // Risk colors (muted, non-aggressive)
  safe: '#5BAE8C',
  safeLight: '#7CC4A6',
  safeBg: 'rgba(91, 174, 140, 0.12)',

  moderate: '#D4A853',
  moderateLight: '#E0BD73',
  moderateBg: 'rgba(212, 168, 83, 0.12)',

  highRisk: '#C96B6B',
  highRiskLight: '#D98E8E',
  highRiskBg: 'rgba(201, 107, 107, 0.12)',

  // Text — dark gray, never pure black
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#A0A8B0',
  textInverse: '#FFFFFF',

  // Accent — soft teal
  accent: '#7AADBD',
  accentLight: '#9DC4D0',

  // UI elements
  border: '#E8E2DB',
  borderLight: '#F0EBE4',
  inputBg: '#F5F2EE',
  overlay: 'rgba(45, 52, 54, 0.5)',
  
  // Status
  error: '#C96B6B',
  errorBg: 'rgba(201, 107, 107, 0.10)',
  success: '#5BAE8C',
  warning: '#D4A853',
  info: '#7AADBD',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * Get risk color based on risk level
 */
const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'safe': return colors.safe;
    case 'moderate': return colors.moderate;
    case 'high_risk': return colors.highRisk;
    default: return colors.textMuted;
  }
};

const getRiskBgColor = (riskLevel) => {
  switch (riskLevel) {
    case 'safe': return colors.safeBg;
    case 'moderate': return colors.moderateBg;
    case 'high_risk': return colors.highRiskBg;
    default: return colors.surfaceLight;
  }
};

const getRiskLabel = (riskLevel) => {
  switch (riskLevel) {
    case 'safe': return 'SAFE';
    case 'moderate': return 'MODERATE';
    case 'high_risk': return 'HIGH RISK';
    default: return 'UNKNOWN';
  }
};

module.exports = { colors, getRiskColor, getRiskBgColor, getRiskLabel };
