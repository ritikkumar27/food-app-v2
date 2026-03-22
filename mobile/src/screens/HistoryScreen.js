import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { analysisAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const response = await analysisAPI.getHistory(pageNum, 20);
      if (response.data?.success) {
        const newHistory = response.data.data.history;
        if (refresh || pageNum === 1) {
          setHistory(newHistory);
        } else {
          setHistory(prev => [...prev, ...newHistory]);
        }
        setHasMore(pageNum < response.data.data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load history:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory(1, true);
    }, [loadHistory])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadHistory(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadHistory(page + 1);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <View>
      <Text style={styles.timestamp}>{formatDate(item.scannedAt)}</Text>
      <ProductCard
        product={{
          productName: item.productName,
          imageUrl: item.imageUrl,
          brands: '',
        }}
        showRisk
        riskLevel={item.riskLevel}
        onPress={() =>
          navigation.navigate('Result', {
            analysisResult: item.result,
            fromHistory: true,
          })
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No scan history</Text>
              <Text style={styles.emptyText}>
                Your scanned food products will appear here
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  timestamp: {
    fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium,
    marginBottom: spacing.xs, marginLeft: spacing.xs,
  },
  emptyCard: {
    alignItems: 'center', padding: spacing.xxl, marginTop: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg, fontWeight: fontWeight.semibold,
    color: colors.textSecondary, marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs,
  },
});

export default HistoryScreen;
