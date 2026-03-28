import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  Animated,
  useColorScheme,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { Colors, getTypeColor, getTypeIcon, resolveScheme } from '../utils/theme';
import { RootStackParamList } from '../../App';

type ResultRoute = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<ResultRoute>();
  const { parsedQR } = route.params;
  const scheme = resolveScheme(useColorScheme());
  const colors = Colors[scheme];

  const [copied, setCopied] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const typeColor = getTypeColor(parsedQR.type, colors);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(parsedQR.raw);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({ message: parsedQR.raw });
  };

  const handlePrimaryAction = () => {
    if (!parsedQR.action) {
      handleCopy();
      return;
    }
    Linking.openURL(parsedQR.action).catch(() => {
      Linking.openSettings();
    });
  };

  const getPrimaryActionLabel = () => {
    switch (parsedQR.type) {
      case 'url': return t('result.openLink');
      case 'email': return t('result.openEmail');
      case 'phone': return t('result.callPhone');
      case 'sms': return t('result.sendSms');
      case 'geo': return t('result.openMap');
      default: return t('result.copy');
    }
  };

  const getPrimaryActionIcon = () => {
    switch (parsedQR.type) {
      case 'url': return 'open-outline';
      case 'email': return 'mail-outline';
      case 'phone': return 'call-outline';
      case 'sms': return 'chatbubble-outline';
      case 'geo': return 'map-outline';
      default: return 'copy-outline';
    }
  };

  const typeLabel = t(`result.types.${parsedQR.type}`, { defaultValue: t('result.types.text') });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <Ionicons name={getPrimaryActionIcon() as any} size={18} color={typeColor} />
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>

        {/* Main content card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {t('result.content')}
          </Text>
          <Text style={[styles.contentText, { color: colors.text }]} selectable>
            {parsedQR.display}
          </Text>

          {/* WiFi metadata */}
          {parsedQR.type === 'wifi' && parsedQR.metadata && (
            <View style={[styles.metaBox, { backgroundColor: colors.cardSecondary }]}>
              {parsedQR.metadata.ssid && (
                <MetaRow label="SSID" value={parsedQR.metadata.ssid} colors={colors} />
              )}
              {parsedQR.metadata.password && (
                <MetaRow label="Password" value={parsedQR.metadata.password} colors={colors} />
              )}
              {parsedQR.metadata.security && (
                <MetaRow label="Security" value={parsedQR.metadata.security} colors={colors} />
              )}
            </View>
          )}

          {/* vCard metadata */}
          {parsedQR.type === 'vcard' && parsedQR.metadata && (
            <View style={[styles.metaBox, { backgroundColor: colors.cardSecondary }]}>
              {parsedQR.metadata.phone && (
                <MetaRow label="Phone" value={parsedQR.metadata.phone} colors={colors} />
              )}
              {parsedQR.metadata.email && (
                <MetaRow label="Email" value={parsedQR.metadata.email} colors={colors} />
              )}
            </View>
          )}
        </View>

        {/* Raw value */}
        {parsedQR.display !== parsedQR.raw && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Raw</Text>
            <Text style={[styles.rawText, { color: colors.textSecondary }]} selectable numberOfLines={4}>
              {parsedQR.raw}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {parsedQR.action && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: typeColor }]}
              onPress={handlePrimaryAction}
            >
              <Ionicons name={getPrimaryActionIcon() as any} size={20} color="#FFF" />
              <Text style={styles.primaryBtnText}>{getPrimaryActionLabel()}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.secondaryBtns}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.card }]}
              onPress={handleCopy}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={20}
                color={copied ? colors.accentGreen : colors.accent}
              />
              <Text style={[styles.secondaryBtnText, { color: copied ? colors.accentGreen : colors.accent }]}>
                {copied ? t('result.copied') : t('result.copy')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.card }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={colors.accent} />
              <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>{t('result.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan again */}
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="qr-code-outline" size={18} color={colors.accent} />
          <Text style={[styles.scanAgainText, { color: colors.accent }]}>{t('result.scanAgain')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

function MetaRow({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 40 },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  typeBadgeText: { fontSize: 14, fontWeight: '600' },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  contentText: { fontSize: 18, fontWeight: '500', lineHeight: 26 },
  rawText: { fontSize: 13, lineHeight: 20 },

  metaBox: { marginTop: 12, borderRadius: 10, padding: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaLabel: { fontSize: 13, fontWeight: '500' },
  metaValue: { fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 12 },

  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  secondaryBtns: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '500' },

  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  scanAgainText: { fontSize: 16, fontWeight: '500' },
});
