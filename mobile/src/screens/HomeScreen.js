import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { foodAPI, analysisAPI } from '../api/client';
import ProductCard from '../components/ProductCard';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const loadRecentScans = useCallback(async () => {
    try {
      const response = await analysisAPI.getHistory(1, 5);
      if (response.data?.success) {
        setRecentScans(response.data.data.history);
      }
    } catch (error) {
      console.log('Failed to load history:', error.message);
    }
  }, []);

  useEffect(() => {
    loadRecentScans();
  }, [loadRecentScans]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRecentScans();
    });
    return unsubscribe;
  }, [navigation, loadRecentScans]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setShowSearch(true);
    try {
      const response = await foodAPI.search(searchQuery.trim());
      if (response.data?.success) {
        setSearchResults(response.data.data.products);
      }
    } catch (error) {
      console.error('Search error:', error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductSelect = async (product) => {
    navigation.navigate('Result', { barcode: product.barcode, productName: product.productName });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRecentScans();
    setIsRefreshing(false);
  };

  const profileName = user?.email?.split('@')[0] || 'User';
  const diseases = user?.profile?.diseases || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {profileName} 👋</Text>
            <Text style={styles.tagline}>What are you eating today?</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Disease tags */}
        {diseases.length > 0 && (
          <View style={styles.diseaseRow}>
            {diseases.map((d) => (
              <View key={d} style={styles.diseaseTag}>
                <Text style={styles.diseaseTagText}>
                  {d.replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food products..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSearch(false); setSearchResults([]); }}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Scan button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner')}
          activeOpacity={0.8}
        >
          <View style={styles.scanIconContainer}>
            <Ionicons name="scan" size={36} color={colors.white} />
          </View>
          <View style={styles.scanTextContainer}>
            <Text style={styles.scanTitle}>Scan Barcode</Text>
            <Text style={styles.scanSubtitle}>Point your camera at a food barcode</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Search results */}
        {showSearch && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Searching...' : `Results (${searchResults.length})`}
            </Text>
            {searchResults.map((product, idx) => (
              <ProductCard
                key={`${product.barcode}-${idx}`}
                product={product}
                onPress={() => handleProductSelect(product)}
              />
            ))}
            {!isSearching && searchResults.length === 0 && (
              <Text style={styles.emptyText}>No products found. Try a different search.</Text>
            )}
          </View>
        )}

        {/* Recent scans */}
        {!showSearch && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {recentScans.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <ProductCard
                  key={scan._id}
                  product={{ productName: scan.productName, imageUrl: scan.imageUrl, brands: '' }}
                  showRisk
                  riskLevel={scan.riskLevel}
                  onPress={() => navigation.navigate('Result', {
                    analysisResult: scan.result,
                    fromHistory: true,
                  })}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="scan-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No scans yet</Text>
                <Text style={styles.emptyText}>Scan a food barcode or search to get started</Text>
              </View>
            )}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.highRisk} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginTop: 2 },
  profileBtn: { padding: spacing.xs },
  diseaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  diseaseTag: {
    backgroundColor: `${colors.moderate}20`, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  diseaseTagText: { color: colors.moderate, fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'capitalize' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: fontSize.md, paddingVertical: spacing.md, marginLeft: spacing.sm },
  scanButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  scanIconContainer: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  scanTextContainer: { flex: 1 },
  scanTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  scanSubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  seeAll: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, gap: spacing.sm, marginTop: spacing.lg,
  },
  logoutText: { color: colors.highRisk, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});

export default HomeScreen;
