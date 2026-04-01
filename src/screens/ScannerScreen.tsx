import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';

import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import jsQR from 'jsqr';
import * as jpeg from 'jpeg-js';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { parseQR, ParsedQR } from '../utils/qrParser';
import { addToHistory, getSettings } from '../utils/storage';
import { useLayout } from '../utils/layout';
import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { getTypeColor, getTypeIcon } from '../utils/theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ScannerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { scannerSize } = useLayout();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [collectedCodes, setCollectedCodes] = useState<Map<string, ParsedQR>>(new Map());
  const [multiPickerVisible, setMultiPickerVisible] = useState(false);
  const [multiPickerCodes, setMultiPickerCodes] = useState<ParsedQR[]>([]);
  const collectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectedRef = useRef<Map<string, ParsedQR>>(new Map());
  const settingsRef = useRef<Awaited<ReturnType<typeof getSettings>> | null>(null);
  const { scheme } = useTheme();
  const themeColors = Colors[scheme];
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate scan line
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: scannerSize - 4,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scannerSize]);

  // Re-enable scanning on focus
  useFocusEffect(
    useCallback(() => {
      setScanning(true);
      setIsProcessing(false);
      collectedRef.current = new Map();
      settingsRef.current = null;
      setCollectedCodes(new Map());
      setMultiPickerVisible(false);
      setMultiPickerCodes([]);
      if (collectTimerRef.current) {
        clearTimeout(collectTimerRef.current);
        collectTimerRef.current = null;
      }
    }, [])
  );

  const finishMultiScan = useCallback(async () => {
    const codes = Array.from(collectedRef.current.values());
    if (codes.length === 0) return;

    const settings = settingsRef.current ?? await getSettings();

    if (settings.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (codes.length === 1) {
      // Single code — normal behavior
      if (settings.saveHistory) await addToHistory(codes[0]);
      navigation.navigate('Result', { parsedQR: codes[0] });
      return;
    }

    // Multiple codes found
    if (settings.multiScanMode === 'all') {
      // Save all to history and show first one
      if (settings.saveHistory) {
        for (const code of codes) await addToHistory(code);
      }
      navigation.navigate('Result', { parsedQR: codes[0] });
    } else {
      // 'choose' mode — show picker
      setMultiPickerCodes(codes);
      setMultiPickerVisible(true);
    }
  }, [navigation]);

  const handleBarCodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (!scanning || isProcessing) return;

    // Skip already-collected codes immediately (no async, no parsing)
    const key = result.data;
    if (collectedRef.current.has(key)) return;

    // Cache settings so we don't call AsyncStorage every frame
    if (!settingsRef.current) {
      settingsRef.current = await getSettings();
    }
    const settings = settingsRef.current;
    const parsed = parseQR(result.data, result.type);

    if (settings.multiScanMode === 'single') {
      // Original behavior — immediate
      setScanning(false);
      setIsProcessing(true);
      if (settings.haptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (settings.saveHistory) await addToHistory(parsed);
      navigation.navigate('Result', { parsedQR: parsed });
      return;
    }

    // Multi-scan mode — collect new code
    collectedRef.current.set(key, parsed);
    setCollectedCodes(new Map(collectedRef.current));

    // Reset timer on each new code — gives 1.5s after the last new code
    if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
    collectTimerRef.current = setTimeout(() => {
      setScanning(false);
      setIsProcessing(true);
      finishMultiScan();
    }, 1500);
  }, [scanning, isProcessing, navigation, finishMultiScan]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('scanner.permissionRequired'), t('scanner.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    setGalleryLoading(true);
    try {
      const uri = result.assets[0].uri;

      // Resize and convert to JPEG for consistent decoding (handles HEIC, PNG, etc.)
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decode JPEG to raw RGBA pixel data
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const rawImageData = jpeg.decode(bytes, { useTArray: true });

      // Scan QR code with jsQR
      const qrResult = jsQR(
        new Uint8ClampedArray(rawImageData.data.buffer),
        rawImageData.width,
        rawImageData.height
      );

      if (qrResult && qrResult.data) {
        const settings = await getSettings();
        if (settings.haptics) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        const parsed = parseQR(qrResult.data);
        if (settings.saveHistory) {
          await addToHistory(parsed);
        }
        navigation.navigate('Result', { parsedQR: parsed });
      } else {
        Alert.alert(t('scanner.noQrFound'), '', [{ text: t('common.ok') }]);
      }
    } catch (e) {
      Alert.alert(t('common.error'), String(e), [{ text: t('common.ok') }]);
    } finally {
      setGalleryLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.permissionContainer} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="qr-code-outline" size={72} color="#FFFFFF" style={{ marginBottom: 24 }} />
        <Text style={styles.permissionTitle}>{t('scanner.permissionRequired')}</Text>
        <Text style={styles.permissionText}>{t('scanner.cameraPermission')}</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
        >
          <Text style={styles.permissionButtonText}>
            {permission.canAskAgain ? t('scanner.grantPermission') : t('scanner.openSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr', 'aztec', 'datamatrix', 'pdf417',
            'ean13', 'ean8', 'upc_a', 'upc_e',
            'code128', 'code39', 'code93', 'codabar', 'itf14',
          ],
        }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      />

      {/* Collected codes badge */}
      {collectedCodes.size > 0 && scanning && (
        <View style={styles.collectedBadge}>
          <Ionicons name="layers" size={16} color="#FFF" />
          <Text style={styles.collectedBadgeText}>
            {collectedCodes.size} {t('settings.multiScanFound')}
          </Text>
        </View>
      )}

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{t('scanner.title')}</Text>
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setTorchOn(v => !v)}
            >
              <Ionicons
                name={torchOn ? 'flash' : 'flash-off'}
                size={24}
                color={torchOn ? '#FFD60A' : '#FFFFFF'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scanner frame area */}
        <View style={styles.middleRow}>
          <View style={[styles.sideDark, { height: scannerSize }]} />
          <View style={[styles.scannerFrame, { width: scannerSize, height: scannerSize }]}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineAnim }] },
              ]}
            />
          </View>
          <View style={[styles.sideDark, { height: scannerSize }]} />
        </View>

        {/* Bottom area */}
        <View style={styles.bottomArea}>
          <Text style={styles.hintText}>{t('scanner.pointCamera')}
          </Text>
          <Text style={styles.hintSubText}>{t('scanner.supportsFormats')}</Text>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery} disabled={galleryLoading}>
            {galleryLoading ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="images-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.galleryBtnText}>
              {galleryLoading ? t('scanner.scanning') : t('scanner.gallery')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Multi-code picker modal */}
      <Modal visible={multiPickerVisible} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: themeColors.card }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: themeColors.separator }]}>
              <Text style={[styles.pickerTitle, { color: themeColors.text }]}>
                {t('settings.multiScanSelect')}
              </Text>
              <TouchableOpacity onPress={() => {
                setMultiPickerVisible(false);
                setScanning(true);
                setIsProcessing(false);
              }}>
                <Ionicons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.pickerSubtitle, { color: themeColors.textSecondary }]}>
              {multiPickerCodes.length} {t('settings.multiScanFound')}
            </Text>
            <FlatList
              data={multiPickerCodes}
              keyExtractor={(item, idx) => item.raw + idx}
              renderItem={({ item }) => {
                const typeColor = getTypeColor(item.type, themeColors);
                const typeIcon = getTypeIcon(item.type);
                return (
                  <TouchableOpacity
                    style={[styles.pickerRow, { borderBottomColor: themeColors.separator }]}
                    onPress={async () => {
                      setMultiPickerVisible(false);
                      const settings = await getSettings();
                      if (settings.saveHistory) await addToHistory(item);
                      navigation.navigate('Result', { parsedQR: item });
                    }}
                  >
                    <View style={[styles.pickerIcon, { backgroundColor: typeColor }]}>
                      <Ionicons name={typeIcon as any} size={18} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerType, { color: themeColors.textSecondary }]}>
                        {t(`result.types.${item.type}`)}
                      </Text>
                      <Text
                        style={[styles.pickerData, { color: themeColors.text }]}
                        numberOfLines={2}
                      >
                        {item.raw}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={themeColors.textTertiary} />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DARK = 'rgba(0,0,0,0.62)';
const CORNER = 22;
const CORNER_W = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: { color: '#FFF', fontSize: 20, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  permissionText: { color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  overlay: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: DARK,
  },
  topTitle: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  topButtons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  middleRow: { flexDirection: 'row', alignItems: 'center' },
  sideDark: { flex: 1, backgroundColor: DARK },

  scannerFrame: {
    overflow: 'hidden',
  },

  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_W, borderLeftWidth: CORNER_W,
    borderColor: '#FFF', borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_W, borderRightWidth: CORNER_W,
    borderColor: '#FFF', borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_W, borderLeftWidth: CORNER_W,
    borderColor: '#FFF', borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_W, borderRightWidth: CORNER_W,
    borderColor: '#FFF', borderBottomRightRadius: 4,
  },

  scanLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  bottomArea: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4, textAlign: 'center' },
  hintSubText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 28, textAlign: 'center', paddingHorizontal: 20 },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  galleryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },

  collectedBadge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    gap: 6,
  },
  collectedBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '65%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 17, fontWeight: '600' },
  pickerSubtitle: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickerType: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', marginBottom: 2 },
  pickerData: { fontSize: 15 },
});
