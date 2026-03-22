import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, getRiskColor, getRiskBgColor, getRiskLabel } from '../theme/colors';
import { borderRadius, fontSize, fontWeight } from '../theme/typography';

const RiskBadge = ({ riskLevel, size = 'medium', showLabel = true }) => {
  const color = getRiskColor(riskLevel);
  const bgColor = getRiskBgColor(riskLevel);
  const label = getRiskLabel(riskLevel);

  const sizeStyles = {
    small: { paddingHorizontal: 10, paddingVertical: 4, fontSize: fontSize.xs },
    medium: { paddingHorizontal: 16, paddingVertical: 8, fontSize: fontSize.sm },
    large: { paddingHorizontal: 24, paddingVertical: 12, fontSize: fontSize.lg },
  };

  const s = sizeStyles[size] || sizeStyles.medium;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color, paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {showLabel && (
        <Text style={[styles.label, { color, fontSize: s.fontSize }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
});

export default RiskBadge;
