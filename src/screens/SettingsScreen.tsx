import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { Colors } from '../utils/theme';
import { useTheme } from '../utils/ThemeContext';
import { useLayout } from '../utils/layout';
import { AppSettings, MultiScanMode, getSettings, saveSettings } from '../utils/storage';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { scheme, setDarkMode } = useTheme();
  const colors = Colors[scheme];
  const { maxContentWidth } = useLayout();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [multiScanPickerVisible, setMultiScanPickerVisible] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveSettings({ [key]: value });
    if (key === 'language' && value !== 'auto') {
      i18n.changeLanguage(value);
    }
    if (key === 'darkMode') {
      setDarkMode(value as boolean);
    }
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === settings?.language)
    ?? SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0];

  const version = Constants.expoConfig?.version ?? '1.0.0';

  if (!settings) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { maxWidth: maxContentWidth, width: '100%', alignSelf: 'center' }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Language */}
      <SectionHeader title={t('settings.language')} colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setLangPickerVisible(true)}
        >
          <Text style={styles.rowEmoji}>{currentLang.flag}</Text>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{currentLang.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <SectionHeader title={t('settings.appearance')} colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <SettingRow
          label={t('settings.darkMode')}
          icon="moon"
          iconColor={colors.accentPurple}
          colors={colors}
          value={settings.darkMode}
          onToggle={v => update('darkMode', v)}
        />
      </View>

      {/* Behavior */}
      <SectionHeader title={t('settings.behavior')} colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <SettingRow
          label={t('settings.hapticsFeedback')}
          icon="phone-portrait"
          iconColor={colors.accentTeal}
          colors={colors}
          value={settings.haptics}
          onToggle={v => update('haptics', v)}
          last={false}
        />
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        <SettingRow
          label={t('settings.autoOpenLinks')}
          icon="open"
          iconColor={colors.accent}
          colors={colors}
          value={settings.autoOpenLinks}
          onToggle={v => update('autoOpenLinks', v)}
          last={false}
        />
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        <SettingRow
          label={t('settings.saveHistoryDesc')}
          icon="time"
          iconColor={colors.accentOrange}
          colors={colors}
          value={settings.saveHistory}
          onToggle={v => update('saveHistory', v)}
          last={false}
        />
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        <TouchableOpacity
          style={styles.row}
          onPress={() => setMultiScanPickerVisible(true)}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
            <Ionicons name="copy-outline" size={16} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.multiScan')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
              {settings.multiScanMode === 'single' ? t('settings.multiScanSingle') :
               settings.multiScanMode === 'all' ? t('settings.multiScanAll') :
               t('settings.multiScanChoose')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <SectionHeader title={t('settings.about')} colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.version')}</Text>
          <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>{version}</Text>
        </View>
      </View>

      {/* Language picker modal */}
      <Modal visible={langPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.language')}</Text>
              <TouchableOpacity onPress={() => setLangPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={l => l.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langRow, { borderBottomColor: colors.separator }]}
                  onPress={() => {
                    update('language', item.code);
                    setLangPickerVisible(false);
                  }}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text style={[styles.langLabel, { color: colors.text }]}>{item.label}</Text>
                  {settings.language === item.code && (
                    <Ionicons name="checkmark" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      {/* Multi-scan mode picker modal */}
      <Modal visible={multiScanPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.multiScan')}</Text>
              <TouchableOpacity onPress={() => setMultiScanPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
              {t('settings.multiScanDesc')}
            </Text>
            {([
              { mode: 'single' as MultiScanMode, label: t('settings.multiScanSingle'), icon: 'scan-outline' },
              { mode: 'all' as MultiScanMode, label: t('settings.multiScanAll'), icon: 'layers-outline' },
              { mode: 'choose' as MultiScanMode, label: t('settings.multiScanChoose'), icon: 'list-outline' },
            ]).map(item => (
              <TouchableOpacity
                key={item.mode}
                style={[styles.langRow, { borderBottomColor: colors.separator }]}
                onPress={() => {
                  update('multiScanMode', item.mode);
                  setMultiScanPickerVisible(false);
                }}
              >
                <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} style={{ marginRight: 14 }} />
                <Text style={[styles.langLabel, { color: colors.text }]}>{item.label}</Text>
                {settings.multiScanMode === item.mode && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: typeof Colors.light }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function SettingRow({
  label, icon, iconColor, colors, value, onToggle, last = true,
}: {
  label: string;
  icon: string;
  iconColor: string;
  colors: typeof Colors.light;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor }]}>
        <Ionicons name={icon as any} size={16} color="#FFF" />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.accentGreen, false: colors.border }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 52,
  },
  rowEmoji: { fontSize: 22, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 58 },

  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutValue: { fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langFlag: { fontSize: 26, marginRight: 14 },
  langLabel: { flex: 1, fontSize: 16 },
});
