import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { foodAPI } from '../api/client';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const ManualEntryScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description || description.trim().length === 0) {
      Alert.alert('Empty Description', 'Please describe the food product you want to log.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await foodAPI.createManualProduct(description.trim());
      
      if (response.data?.success) {
        // Success! Go straight to the Result screen just like scanning a barcode.
        const productData = response.data.data.product;
        
        navigation.replace('Result', {
          barcode: productData.barcode,
          productName: productData.productName,
        });
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to parse product. Please try again.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to analyze product. Please enter a valid clear food description.';
      Alert.alert('Input Unclear', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="create-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Describe Your Food</Text>
          <Text style={styles.subtitle}>
            Enter the product name, brand, or main ingredients. Our AI will automatically generate the nutritional profile for you.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. A bowl of whole wheat pasta with cherry tomatoes and olive oil"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.submitText}> Analyzing Details...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>Generate Product Log</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingBottom: spacing.md, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  scroll: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', marginTop: spacing.lg,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent + '20',
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 20 },
  inputContainer: { width: '100%', marginBottom: spacing.xl },
  textInput: {
    backgroundColor: colors.background, borderRadius: borderRadius.lg,
    padding: spacing.md, fontSize: fontSize.md, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border, minHeight: 120,
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    paddingVertical: spacing.md, width: '100%', alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  submitText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
});

export default ManualEntryScreen;
