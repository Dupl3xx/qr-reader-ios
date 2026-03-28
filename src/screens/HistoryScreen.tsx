import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Swipeable } from 'react-native-gesture-handler';

import { HistoryItem, getHistory, deleteHistoryItem, clearHistory } from '../utils/storage';
import { Colors, getTypeColor, getTypeIcon, resolveScheme } from '../utils/theme';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const scheme = resolveScheme(useColorScheme());
  const colors = Colors[scheme];
  const [items, setItems] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setItems);
    }, [])
  );

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClear = () => {
    Alert.alert(
      t('history.clearAll'),
      t('history.clearConfirm'),
      [
        { text: t('history.clearNo'), style: 'cancel' },
        {
          text: t('history.clearYes'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setItems([]);
          },
        },
      ]
    );
  };

  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemDay.getTime() === today.getTime()) return t('history.today');
    if (itemDay.getTime() === yesterday.getTime()) return t('history.yesterday');
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Group by day
  const grouped: { date: string; items: HistoryItem[] }[] = [];
  for (const item of items) {
    const d = formatDate(item.scannedAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) {
      last.items.push(item);
    } else {
      grouped.push({ date: d, items: [item] });
    }
  }

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const typeColor = getTypeColor(item.parsedQR.type, colors);
    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={[styles.deleteAction, { backgroundColor: colors.accentRed }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={[styles.historyItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Result', { parsedQR: item.parsedQR })}
          activeOpacity={0.7}
        >
          <View style={[styles.typeIcon, { backgroundColor: typeColor + '20' }]}>
            <Ionicons name={getTypeIcon(item.parsedQR.type) as any} size={20} color={typeColor} />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemText, { color: colors.text }]} numberOfLines={2}>
              {item.parsedQR.display}
            </Text>
            <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
              {formatTime(item.scannedAt)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('history.empty')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('history.emptySubtitle')}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={grouped}
            keyExtractor={g => g.date}
            renderItem={({ item: group }) => (
              <View>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  {group.date}
                </Text>
                {group.items.map(histItem => (
                  <View key={histItem.id}>{renderItem({ item: histItem })}</View>
                ))}
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={16} color={colors.accentRed} />
            <Text style={[styles.clearBtnText, { color: colors.accentRed }]}>{t('history.clearAll')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  list: { paddingVertical: 8, paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: { flex: 1, marginRight: 8 },
  itemText: { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  itemTime: { fontSize: 12 },

  deleteAction: {
    width: 70,
    marginBottom: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  clearBtnText: { fontSize: 15, fontWeight: '500' },
});
