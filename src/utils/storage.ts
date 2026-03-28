import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParsedQR } from './qrParser';

const HISTORY_KEY = '@qrreader_history';
const SETTINGS_KEY = '@qrreader_settings';

export interface HistoryItem {
  id: string;
  parsedQR: ParsedQR;
  scannedAt: number;
}

export interface AppSettings {
  darkMode: boolean;
  haptics: boolean;
  sound: boolean;
  autoOpenLinks: boolean;
  saveHistory: boolean;
  language: string;
}

export const defaultSettings: AppSettings = {
  darkMode: false,
  haptics: true,
  sound: true,
  autoOpenLinks: false,
  saveHistory: true,
  language: 'auto',
};

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(parsedQR: ParsedQR): Promise<void> {
  try {
    const history = await getHistory();
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      parsedQR,
      scannedAt: Date.now(),
    };
    const updated = [item, ...history].slice(0, 200);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const history = await getHistory();
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.filter(h => h.id !== id)));
  } catch {}
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
}
