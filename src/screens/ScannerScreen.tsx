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
  Dimensions,
} from 'react-native';

import { CameraView, CameraType, FlashMode, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
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

import { parseQR } from '../utils/qrParser';
import { addToHistory, getSettings } from '../utils/storage';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.72;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ScannerScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [scanning, setScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate scan line
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCANNER_SIZE - 4,
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
  }, []);

  // Re-enable scanning on focus
  useFocusEffect(
    useCallback(() => {
      setScanning(true);
      setIsProcessing(false);
    }, [])
  );

  const handleBarCodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (!scanning || isProcessing) return;
    setScanning(false);
    setIsProcessing(true);

    const settings = await getSettings();

    if (settings.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const parsed = parseQR(result.data);

    if (settings.saveHistory) {
      await addToHistory(parsed);
    }

    navigation.navigate('Result', { parsedQR: parsed });
  }, [scanning, isProcessing, navigation]);

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
        flash={flash}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'aztec', 'datamatrix', 'pdf417', 'code128', 'code39', 'ean13', 'ean8'] }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{t('scanner.title')}</Text>
          <View style={styles.topButtons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
            >
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off'}
                size={24}
                color={flash === 'on' ? '#FFD60A' : '#FFFFFF'}
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
          <View style={styles.sideDark} />
          <View style={styles.scannerFrame}>
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
          <View style={styles.sideDark} />
        </View>

        {/* Bottom area */}
        <View style={styles.bottomArea}>
          <Text style={styles.hintText}>{t('scanner.pointCamera')}</Text>
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
  sideDark: { flex: 1, height: SCANNER_SIZE, backgroundColor: DARK },

  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
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
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 32 },
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
});
