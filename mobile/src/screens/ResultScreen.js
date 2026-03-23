import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ScrollView, Alert, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analysisAPI, consumptionAPI } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import WarningCard from '../components/WarningCard';
import NutrientBar from '../components/NutrientBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, getRiskColor, getRiskBgColor, getRiskLabel } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

/**
 * ResultScreen — THE MOST CRITICAL SCREEN
 * 
 * Shows: risk level → explanation → recommendations → warnings → nutrients
 * NOT raw data first. Insights first, data on demand.
 */
const ResultScreen = ({ route, navigation }) => {
  const { barcode, productName, analysisResult, fromHistory } = route.params || {};
  const [analysis, setAnalysis] = useState(analysisResult || null);
  const [isLoading, setIsLoading] = useState(!analysisResult);
  const [error, setError] = useState(null);
  const [expandedNutrients, setExpandedNutrients] = useState(false);
  const [expandedAdditives, setExpandedAdditives] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [logInsight, setLogInsight] = useState(null);

  useEffect(() => {
    if (!analysisResult && barcode) {
      runAnalysis();
    }
  }, [barcode]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analysisAPI.analyze(barcode);
      if (response.data?.success) {
        setAnalysis(response.data.data.analysis);
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to analyze product. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogConsumption = async () => {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount in grams.');
      return;
    }
    
    setIsLogging(true);
    setLogInsight(null);
    try {
      const response = await consumptionAPI.logConsumption(barcode, Number(quantity));
      if (response.data?.success) {
        setLogInsight(response.data.data.insight);
        Alert.alert('Success', 'Consumption logged successfully!');
        setQuantity('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to log consumption. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingOverlay message="Analyzing food for your health profile..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.highRisk} />
        <Text style={styles.errorTitle}>Analysis Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!analysis) return null;

  const riskColor = getRiskColor(analysis.riskLevel);
  const riskBgColor = getRiskBgColor(analysis.riskLevel);
  const riskLabel = getRiskLabel(analysis.riskLevel);
  const productInfo = analysis.productInfo || {};
  const warnings = analysis.warnings || [];
  const breakdown = analysis.nutrientBreakdown || {};
  const additiveFlags = analysis.additiveFlags || [];

  // Max values for nutrient bars
  const maxValues = {
    calories: 600, sugar: 30, sodium: 800, fat: 30,
    saturatedFat: 15, transFat: 5, protein: 20, fiber: 10,
    carbohydrates: 80, salt: 3,
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* ═══ HERO SECTION: Risk Level ═══ */}
        <View style={[styles.heroCard, { backgroundColor: riskBgColor, borderColor: riskColor + '40' }]}>
          {productInfo.imageUrl ? (
            <Image source={{ uri: productInfo.imageUrl }} style={styles.productImage} />
          ) : null}
          <Text style={styles.productName}>{productInfo.name || productName || 'Food Product'}</Text>
          {productInfo.brands ? (
            <Text style={styles.productBrand}>{productInfo.brands}</Text>
          ) : null}
          
          <View style={styles.riskRow}>
            <RiskBadge riskLevel={analysis.riskLevel} size="large" />
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: riskColor }]}>{analysis.riskScore}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </View>
        </View>

        {/* ═══ EXPLANATION (MOST IMPORTANT) ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={22} color={colors.primary} />
            <Text style={styles.cardTitle}>Why this rating?</Text>
          </View>
          <Text style={styles.explanation}>{analysis.explanation}</Text>
        </View>

        {/* ═══ RECOMMENDATIONS ═══ */}
        <View style={styles.recRow}>
          <View style={[styles.recCard, { flex: 1, marginRight: spacing.sm }]}>
            <Ionicons name="restaurant-outline" size={24} color={colors.accent} />
            <Text style={styles.recTitle}>Portion</Text>
            <Text style={styles.recValue}>
              {analysis.portionRecommendation?.label || 'N/A'}
            </Text>
          </View>
          <View style={[styles.recCard, { flex: 1, marginLeft: spacing.sm }]}>
            <Ionicons name="calendar-outline" size={24} color={colors.accent} />
            <Text style={styles.recTitle}>Frequency</Text>
            <Text style={styles.recValue}>
              {analysis.frequencyRecommendation?.label || 'N/A'}
            </Text>
          </View>
        </View>

        {/* ═══ WARNINGS ═══ */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={20} color={colors.moderate} />
              <Text style={styles.sectionTitle}>Warnings ({warnings.length})</Text>
            </View>
            {warnings.map((warning, idx) => (
              <WarningCard key={idx} warning={warning} />
            ))}
          </View>
        )}

        {/* ═══ PROCESSING LEVEL ═══ */}
        {analysis.novaGroup && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.cardTitle}>Processing Level</Text>
            </View>
            <View style={styles.novaRow}>
              {[1, 2, 3, 4].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.novaBlock,
                    analysis.novaGroup === level && styles.novaBlockActive,
                    analysis.novaGroup === level && level === 4 && styles.novaBlockDanger,
                  ]}
                >
                  <Text style={[
                    styles.novaText,
                    analysis.novaGroup === level && styles.novaTextActive,
                  ]}>
                    {level}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.novaLabel}>
              {analysis.novaGroup === 1 ? 'Minimally processed' :
               analysis.novaGroup === 2 ? 'Processed ingredients' :
               analysis.novaGroup === 3 ? 'Processed food' :
               'Ultra-processed food'}
            </Text>
          </View>
        )}

        {/* ═══ CONSUMPTION LOGGING ═══ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="scale-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Log Consumption</Text>
          </View>
          <View style={styles.logContainer}>
            <TextInput
              style={styles.quantityInput}
              placeholder="e.g. 150"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            <Text style={styles.unitText}>grams</Text>
            <TouchableOpacity 
              style={[styles.logBtn, isLogging && styles.logBtnDisabled]}
              onPress={handleLogConsumption}
              disabled={isLogging}
            >
              {isLogging ? <ActivityIndicator color={colors.white} /> : <Text style={styles.logBtnText}>Log It</Text>}
            </TouchableOpacity>
          </View>
          
          {logInsight && (
            <View style={[styles.insightBox, { 
              borderColor: logInsight.harmLevel === 'high' ? colors.highRisk : 
                           logInsight.harmLevel === 'moderate' ? colors.moderate : colors.safe 
            }]}>
              <Text style={styles.insightTitle}>AI Insight: {logInsight.harmLevel.toUpperCase()} IMPACT</Text>
              <Text style={styles.insightText}>{logInsight.explanation}</Text>
              <Text style={styles.insightRec}>{logInsight.recommendation}</Text>
            </View>
          )}
        </View>

        {/* ═══ EXPANDABLE: Nutrition Details ═══ */}
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => setExpandedNutrients(!expandedNutrients)}
          activeOpacity={0.7}
        >
          <View style={styles.expandableLeft}>
            <Ionicons name="nutrition-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.expandableTitle}>Nutrition Details (per 100g)</Text>
          </View>
          <Ionicons
            name={expandedNutrients ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
        {expandedNutrients && (
          <View style={styles.expandableBody}>
            {Object.entries(breakdown).map(([key, nutrient]) => (
              <NutrientBar
                key={key}
                label={nutrient.label}
                value={nutrient.value}
                unit={nutrient.unit}
                status={nutrient.status}
                maxValue={maxValues[key] || 100}
              />
            ))}
          </View>
        )}

        {/* ═══ EXPANDABLE: Additives ═══ */}
        {analysis.additivesDetails && analysis.additivesDetails.length > 0 ? (
          <>
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={() => setExpandedAdditives(!expandedAdditives)}
              activeOpacity={0.7}
            >
              <View style={styles.expandableLeft}>
                <Ionicons name="flask-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.expandableTitle}>Additives & Preservatives ({analysis.additivesDetails.length})</Text>
              </View>
              <Ionicons
                name={expandedAdditives ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {expandedAdditives && (
              <View style={styles.expandableBody}>
                {analysis.additivesDetails.map((additive, idx) => (
                  <View key={idx} style={[styles.additiveCard, { 
                    borderLeftColor: additive.riskLevel === 'high' ? colors.highRisk : 
                                     additive.riskLevel === 'moderate' ? colors.moderate : colors.safe 
                  }]}>
                    <View style={styles.additiveHeaderRow}>
                      <Text style={styles.additiveName}>{additive.name}</Text>
                      <View style={[styles.additiveRiskBadge, {
                        backgroundColor: additive.riskLevel === 'high' ? colors.highRisk + '20' : 
                                         additive.riskLevel === 'moderate' ? colors.moderate + '20' : colors.safe + '20'
                      }]}>
                        <Text style={[styles.additiveRiskText, {
                          color: additive.riskLevel === 'high' ? colors.highRisk : 
                                 additive.riskLevel === 'moderate' ? colors.moderate : colors.safe
                        }]}>
                          {additive.riskLevel.toUpperCase()} RISK
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.additiveCategoryRow}>
                      <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.additiveCategory}>{additive.category}</Text>
                    </View>
                    
                    <Text style={styles.additiveExplanation}>{additive.explanation}</Text>
                    
                    {additive.healthEffects && (
                      <View style={styles.additiveEffectsBox}>
                        <Ionicons name="medical-outline" size={14} color={colors.primary} />
                        <Text style={styles.additiveEffectsText}>{additive.healthEffects}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.noAdditivesCard}>
            <Ionicons name="leaf-outline" size={24} color={colors.safe} />
            <Text style={styles.noAdditivesText}>No known concerning additives or preservatives detected.</Text>
          </View>
        )}

        {/* NutriScore */}
        {analysis.nutriScore && (
          <View style={styles.nutriScoreRow}>
            <Text style={styles.nutriScoreLabel}>Nutri-Score:</Text>
            <View style={[styles.nutriScoreBadge, {
              backgroundColor: analysis.nutriScore === 'a' ? colors.safe :
                               analysis.nutriScore === 'b' ? colors.safeLight :
                               analysis.nutriScore === 'c' ? colors.moderate :
                               analysis.nutriScore === 'd' ? colors.moderateLight :
                               colors.highRisk,
            }]}>
              <Text style={styles.nutriScoreText}>{analysis.nutriScore.toUpperCase()}</Text>
            </View>
          </View>
        )}

        {/* ═══ MANUAL ENTRY FALLBACK ═══ */}
        <View style={styles.manualFallbackContainer}>
          <Text style={styles.manualFallbackText}>Not the right product?</Text>
          <TouchableOpacity 
            style={styles.manualFallbackBtn}
            onPress={() => navigation.navigate('ManualEntry')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.manualFallbackBtnText}>Enter Product Manually</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },

  // Hero
  heroCard: {
    borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', borderWidth: 1, marginBottom: spacing.lg,
  },
  productImage: {
    width: 100, height: 100, borderRadius: borderRadius.lg,
    marginBottom: spacing.md, backgroundColor: colors.surfaceLight,
  },
  productName: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.textPrimary, textAlign: 'center', marginBottom: 4,
  },
  productBrand: {
    fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md,
  },
  riskRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    marginTop: spacing.sm,
  },
  scoreContainer: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: fontSize.hero, fontWeight: fontWeight.heavy },
  scoreLabel: { fontSize: fontSize.lg, color: colors.textMuted, fontWeight: fontWeight.medium },

  // Card
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary,
  },
  explanation: {
    fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 24,
  },

  // Recommendations
  recRow: { flexDirection: 'row', marginBottom: spacing.lg },
  recCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  recTitle: {
    fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.bold,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  recValue: {
    fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center', lineHeight: 20,
  },

  // Warnings
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary,
  },

  // NOVA
  novaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  novaBlock: {
    flex: 1, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center',
  },
  novaBlockActive: { backgroundColor: colors.safe },
  novaBlockDanger: { backgroundColor: colors.highRisk },
  novaText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textMuted },
  novaTextActive: { color: colors.white },
  novaLabel: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },

  // Logging
  logContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm,
  },
  quantityInput: {
    flex: 1, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md,
    padding: spacing.md, fontSize: fontSize.md, color: colors.textPrimary,
  },
  unitText: { fontSize: fontSize.md, color: colors.textSecondary },
  logBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  logBtnDisabled: { opacity: 0.7 },
  logBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  insightBox: {
    marginTop: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md,
    borderLeftWidth: 4, backgroundColor: colors.surfaceLight,
  },
  insightTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  insightText: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  insightRec: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },

  // Expandable
  expandableHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  expandableLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  expandableTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  expandableBody: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },

  // Additives
  additiveCard: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.md, borderLeftWidth: 4, 
  },
  additiveHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  additiveName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary, flex: 1, marginRight: spacing.xs },
  additiveRiskBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  additiveRiskText: { fontSize: 10, fontWeight: fontWeight.bold },
  additiveCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  additiveCategory: { fontSize: fontSize.sm, color: colors.textMuted },
  additiveExplanation: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 20 },
  additiveEffectsBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    backgroundColor: colors.primary + '10', padding: spacing.sm, borderRadius: borderRadius.sm
  },
  additiveEffectsText: { fontSize: fontSize.sm, color: colors.primary, flex: 1, lineHeight: 18 },
  noAdditivesCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg,
    backgroundColor: colors.safe + '10', borderRadius: borderRadius.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.safe + '40'
  },
  noAdditivesText: { fontSize: fontSize.sm, color: colors.safe, fontWeight: fontWeight.medium, flex: 1 },

  // NutriScore
  nutriScoreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.md,
  },
  nutriScoreLabel: { fontSize: fontSize.md, color: colors.textMuted },
  nutriScoreBadge: {
    width: 36, height: 36, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  nutriScoreText: { fontSize: fontSize.lg, fontWeight: fontWeight.heavy, color: colors.white },

  // Manual Fallback
  manualFallbackContainer: { marginTop: spacing.xxxl, alignItems: 'center' },
  manualFallbackText: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.sm },
  manualFallbackBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  manualFallbackBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.bold },

  // Error
  errorContainer: {
    flex: 1, backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center',
    marginBottom: spacing.lg, lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  retryText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  backLink: { marginTop: spacing.md, padding: spacing.sm },
  backLinkText: { color: colors.textMuted, fontSize: fontSize.md },
});

export default ResultScreen;
