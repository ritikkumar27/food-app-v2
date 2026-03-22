import React, { useState } from 'react';
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
  { key: 'diabetes', label: 'Diabetes', icon: 'water-outline' },
  { key: 'hypertension', label: 'Hypertension', icon: 'heart-outline' },
  { key: 'heart_disease', label: 'Heart Disease', icon: 'pulse-outline' },
  { key: 'kidney_disease', label: 'Kidney Disease', icon: 'fitness-outline' },
];

const ProfileSetupScreen = ({ navigation }) => {
  const { refreshUser } = useAuth();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [diseases, setDiseases] = useState([]);
  const [dietaryPreference, setDietaryPreference] = useState('non-veg');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const toggleDisease = (key) => {
    setDiseases(prev =>
      prev.includes(key)
        ? prev.filter(d => d !== key)
        : [...prev, key]
    );
  };

  const calculateBMI = () => {
    if (!weight || !height) return null;
    const h = parseFloat(height) / 100;
    return (parseFloat(weight) / (h * h)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { label: 'Underweight', color: colors.moderate };
    if (bmi < 25) return { label: 'Normal', color: colors.safe };
    if (bmi < 30) return { label: 'Overweight', color: colors.moderate };
    return { label: 'Obese', color: colors.highRisk };
  };

  const handleSave = async () => {
    if (!age || !gender || !height || !weight) {
      Alert.alert('Missing Info', 'Please fill in all body metrics.');
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
      // No manual navigation needed — AppNavigator reactively switches to Main
      // once profileCompleted becomes true after refreshUser()
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
        ))}
      </View>

      {step === 1 && (
        <View>
          <Text style={styles.title}>Body Metrics</Text>
          <Text style={styles.subtitle}>Help us personalize your food safety analysis</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Your age"
              placeholderTextColor={colors.textMuted}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
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
                  <Ionicons
                    name={g === 'male' ? 'male' : g === 'female' ? 'female' : 'person'}
                    size={20}
                    color={gender === g ? colors.primary : colors.textMuted}
                  />
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
                placeholder="170"
                placeholderTextColor={colors.textMuted}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="70"
                placeholderTextColor={colors.textMuted}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {bmi && (
            <View style={styles.bmiCard}>
              <Text style={styles.bmiLabel}>Your BMI</Text>
              <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmi}</Text>
              <Text style={[styles.bmiCategory, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!age || !gender || !height || !weight) {
                Alert.alert('Missing Info', 'Please fill in all fields.');
                return;
              }
              setStep(2);
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View>
          <Text style={styles.title}>Health Conditions</Text>
          <Text style={styles.subtitle}>Select any conditions you have. This directly affects how we analyze foods for you.</Text>

          <View style={styles.diseaseGrid}>
            {DISEASES.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.diseaseCard,
                  diseases.includes(d.key) && styles.diseaseCardActive,
                ]}
                onPress={() => toggleDisease(d.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={d.icon}
                  size={28}
                  color={diseases.includes(d.key) ? colors.primary : colors.textMuted}
                />
                <Text style={[
                  styles.diseaseText,
                  diseases.includes(d.key) && styles.diseaseTextActive,
                ]}>
                  {d.label}
                </Text>
                {diseases.includes(d.key) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>
            {diseases.length === 0
              ? "No conditions? That's great! We'll still analyze for general health."
              : `${diseases.length} condition${diseases.length > 1 ? 's' : ''} selected — we'll apply stricter limits.`
            }
          </Text>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1, marginLeft: spacing.md }]} onPress={() => setStep(3)}>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 3 && (
        <View>
          <Text style={styles.title}>Dietary Preference</Text>
          <Text style={styles.subtitle}>This helps us filter food recommendations</Text>

          <View style={styles.dietRow}>
            {[
              { key: 'veg', label: 'Vegetarian', icon: 'leaf-outline', color: colors.safe },
              { key: 'non-veg', label: 'Non-Vegetarian', icon: 'restaurant-outline', color: colors.highRisk },
            ].map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.dietCard,
                  dietaryPreference === d.key && { borderColor: d.color, backgroundColor: `${d.color}12` },
                ]}
                onPress={() => setDietaryPreference(d.key)}
              >
                <Ionicons name={d.icon} size={32} color={dietaryPreference === d.key ? d.color : colors.textMuted} />
                <Text style={[
                  styles.dietText,
                  dietaryPreference === d.key && { color: d.color },
                ]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { flex: 1, marginLeft: spacing.md }, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Complete Setup'}</Text>
              <Ionicons name="checkmark" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  progressRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginBottom: spacing.xl, gap: spacing.sm,
  },
  progressDot: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.surfaceLight,
  },
  progressDotActive: { backgroundColor: colors.primary },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  inputGroup: { marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: colors.textPrimary, fontSize: fontSize.md,
  },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: spacing.md, gap: spacing.xs,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
  genderText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  genderTextActive: { color: colors.primary },
  row: { flexDirection: 'row' },
  bmiCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  bmiLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.xs },
  bmiValue: { fontSize: fontSize.hero, fontWeight: fontWeight.heavy },
  bmiCategory: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  diseaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  diseaseCard: {
    width: '48%', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', gap: spacing.sm,
  },
  diseaseCardActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  diseaseText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium, textAlign: 'center' },
  diseaseTextActive: { color: colors.primary },
  checkmark: { position: 'absolute', top: 8, right: 8 },
  hint: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  dietRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  dietCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: spacing.xl,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', gap: spacing.sm,
  },
  dietText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  button: {
    flexDirection: 'row', backgroundColor: colors.primary,
    borderRadius: borderRadius.md, paddingVertical: spacing.md + 2,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.xs },
  backText: { color: colors.textSecondary, fontSize: fontSize.md },
});

export default ProfileSetupScreen;
