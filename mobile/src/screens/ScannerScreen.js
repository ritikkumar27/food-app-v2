import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/typography';

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Navigate to Result screen with barcode
    navigation.navigate('Result', { barcode: data });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            NutriGuard needs camera access to scan food barcodes
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanning frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.frameHint}>
            {scanned ? 'Barcode detected!' : 'Align barcode within the frame'}
          </Text>
        </View>

        {/* Bottom */}
        <View style={styles.bottom}>
          {scanned ? (
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.rescanText}>Scan Again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.rescanBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ManualEntry')}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.rescanText, { color: colors.textPrimary }]}>Enter Manually</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.white },
  frameContainer: { alignItems: 'center' },
  frame: {
    width: 260, height: 160, borderRadius: borderRadius.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 30, height: 30,
    borderColor: colors.primary, borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  frameHint: {
    color: colors.white, fontSize: fontSize.sm,
    textAlign: 'center', marginTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bottom: {
    alignItems: 'center', paddingBottom: spacing.xxxl,
  },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  rescanText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  permissionCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xl, alignItems: 'center', margin: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  permissionTitle: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center',
    marginBottom: spacing.lg, lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  permissionBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  backLink: { marginTop: spacing.md, padding: spacing.sm },
  backLinkText: { color: colors.textMuted, fontSize: fontSize.md },
});

export default ScannerScreen;
