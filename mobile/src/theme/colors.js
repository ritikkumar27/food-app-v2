/**
 * NutriGuard Color Palette — Dark-mode-first, premium design
 */
const colors = {
  // Background layers
  background: '#0A0E1A',
  surface: '#141929',
  surfaceLight: '#1E2438',
  surfaceElevated: '#252B3F',

  // Primary brand
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4F46CC',

  // Risk colors
  safe: '#00D68F',
  safeLight: '#33E0A8',
  safeBg: 'rgba(0, 214, 143, 0.12)',

  moderate: '#FFB547',
  moderateLight: '#FFC76D',
  moderateBg: 'rgba(255, 181, 71, 0.12)',

  highRisk: '#FF4757',
  highRiskLight: '#FF6B7A',
  highRiskBg: 'rgba(255, 71, 87, 0.12)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C4',
  textMuted: '#6B7394',
  textInverse: '#0A0E1A',

  // Accent
  accent: '#00B8D4',
  accentLight: '#33C9DF',

  // UI elements
  border: '#2A3150',
  borderLight: '#363D5A',
  inputBg: '#1A1F33',
  overlay: 'rgba(10, 14, 26, 0.8)',
  
  // Status
  error: '#FF4757',
  errorBg: 'rgba(255, 71, 87, 0.12)',
  success: '#00D68F',
  warning: '#FFB547',
  info: '#00B8D4',

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
