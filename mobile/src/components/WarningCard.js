import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getRiskColor } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const WarningCard = ({ warning }) => {
  const getIcon = () => {
    switch (warning.type) {
      case 'disease': return 'medical-outline';
      case 'additive': return 'flask-outline';
      case 'processing': return 'construct-outline';
      case 'general': return 'alert-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getColor = () => {
    if (warning.severity === 'high_risk' || warning.severity === 'high') return colors.highRisk;
    if (warning.severity === 'moderate') return colors.moderate;
    return colors.safe;
  };

  const color = getColor();

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={getIcon()} size={18} color={color} />
      </View>
      <View style={styles.content}>
        {warning.disease && (
          <Text style={styles.diseaseLabel}>
            {warning.disease.toUpperCase()}
          </Text>
        )}
        <Text style={styles.message}>{warning.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  diseaseLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  message: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});

export default WarningCard;
