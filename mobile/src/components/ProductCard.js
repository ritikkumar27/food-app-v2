import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, getRiskColor } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';
import RiskBadge from './RiskBadge';

const ProductCard = ({ product, onPress, showRisk = false, riskLevel }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="nutrition-outline" size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.productName || 'Unknown Product'}</Text>
        {product.brands ? (
          <Text style={styles.brand} numberOfLines={1}>{product.brands}</Text>
        ) : null}
        {showRisk && riskLevel && (
          <View style={styles.riskRow}>
            <RiskBadge riskLevel={riskLevel} size="small" />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  placeholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  brand: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  riskRow: {
    marginTop: 6,
  },
});

export default ProductCard;
