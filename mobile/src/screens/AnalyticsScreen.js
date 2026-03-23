import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { consumptionAPI } from '../api/client';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await consumptionAPI.getAnalytics();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load analytics.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback for empty data
  const chartData = data.dailyCalories?.data?.length > 0 
    ? data.dailyCalories 
    : { labels: ['Mon', 'Tue'], data: [0, 0] };

  const pieData = data.macroDistribution?.length > 0
    ? data.macroDistribution
    : [
      { name: 'Protein', population: 1, color: '#5BAE8C', legendFontColor: '#636E72', legendFontSize: 12 },
      { name: 'Carbs', population: 1, color: '#7AADBD', legendFontColor: '#636E72', legendFontSize: 12 },
      { name: 'Fat', population: 1, color: '#D4A853', legendFontColor: '#636E72', legendFontSize: 12 }
    ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>30-Day Health Analytics</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Health Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{data.score}</Text>
          </View>
          <Text style={styles.scoreSubtitle}>Based on last 30 days macros</Text>
        </View>

        {/* Daily Calories Line Chart */}
        <Text style={styles.sectionTitle}>Daily Calories</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{ data: chartData.data }]
            }}
            width={screenWidth - spacing.lg * 2 - 2} // minus padding and borders
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* Macro Distribution Pie Chart */}
        <Text style={styles.sectionTitle}>Macro Distribution</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={pieData}
            width={screenWidth - spacing.lg * 2 - 2}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border
  },
  title: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.textPrimary },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  chartContainer: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.sm, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.xl, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  scoreTitle: { fontSize: fontSize.lg, fontWeight: 'bold', color: colors.textSecondary, marginBottom: spacing.sm },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  scoreValue: { fontSize: 36, fontWeight: 'bold', color: colors.white },
  scoreSubtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  errorText: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  backBtnText: { color: colors.white, fontWeight: 'bold', fontSize: fontSize.md },
});

export default AnalyticsScreen;
