import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/client';
import DiseaseChip from '../components/DiseaseChip';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const DISEASES = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'hypertension', label: 'Hypertension' },
  { key: 'heart_disease', label: 'Heart Disease' },
  { key: 'kidney_disease', label: 'Kidney Disease' },
];

const ProfileEditScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const profile = user?.profile || {};

  const [age, setAge] = useState(profile.age?.toString() || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [diseases, setDiseases] = useState(profile.diseases || []);
  const [dietaryPreference, setDietaryPreference] = useState(profile.dietaryPreference || 'non-veg');
  const [isLoading, setIsLoading] = useState(false);

  const toggleDisease = (key) => {
    setDiseases(prev =>
      prev.includes(key)
        ? prev.filter(d => d !== key)
        : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!age || !gender || !height || !weight) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      await userAPI.updateProfile({
        age: parseInt(age),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        diseases,
        dietaryPreference,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const bmi = height && weight
    ? (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Body Metrics */}
      <Text style={styles.sectionTitle}>Body Metrics</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholder="Age"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {['male', 'female', 'other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {bmi && (
        <View style={styles.bmiCard}>
          <Text style={styles.bmiLabel}>BMI: <Text style={styles.bmiValue}>{bmi}</Text></Text>
        </View>
      )}

      {/* Diseases */}
      <Text style={styles.sectionTitle}>Health Conditions</Text>
      <View style={styles.chipRow}>
        {DISEASES.map((d) => (
          <DiseaseChip
            key={d.key}
            label={d.label}
            selected={diseases.includes(d.key)}
            onPress={() => toggleDisease(d.key)}
          />
        ))}
      </View>

      {/* Diet */}
      <Text style={styles.sectionTitle}>Dietary Preference</Text>
      <View style={styles.genderRow}>
        {['veg', 'non-veg'].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.genderBtn, dietaryPreference === d && styles.genderBtnActive]}
            onPress={() => setDietaryPreference(d)}
          >
            <Text style={[styles.genderText, dietaryPreference === d && styles.genderTextActive]}>
              {d === 'veg' ? '🥬 Veg' : '🍖 Non-Veg'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary,
    marginBottom: spacing.md, marginTop: spacing.lg,
  },
  inputGroup: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: colors.textPrimary, fontSize: fontSize.md,
  },
  row: { flexDirection: 'row' },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.md,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
  genderText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  genderTextActive: { color: colors.primary },
  bmiCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  bmiLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  bmiValue: { color: colors.primary, fontWeight: fontWeight.bold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});

export default ProfileEditScreen;
