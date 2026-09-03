
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Traduccion } from '../../../shared/types';
import { useTranslation } from '../../../app/config/i18n';
import { translationsService, type SavedTranslation } from '../../../feature/Translation/services/translations.service';
import { showAlert, showConfirm } from '../../../shared/utils/dialogs';

type HistoryItem = Traduccion & { hora: string };

const mapSavedTranslation = (row: SavedTranslation): HistoryItem => {
  const date = new Date(row.created_at);
  return {
    id_traduccion: row.translation_id,
    texto_entrada: row.input_text,
    texto_traducido: row.output_text,
    tipo: row.type,
    fecha_traduccion: date.toLocaleDateString(),
    hora: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    is_deleted: row.is_deleted,
  };
};

type TipoConfig = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  darkColor: string;
};

const keyExtractor = (item: HistoryItem) => String(item.id_traduccion);

export const HistoryScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numCols = isTablet ? 2 : 1;
  const C = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<string>('');

  const filtered = items.filter((p) =>
    p.texto_entrada.toLowerCase().includes(query.toLowerCase())
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const rows = await translationsService.list({ limit: 100 });
          if (active) setItems(rows.map(mapSavedTranslation));
        } catch {
          if (active) setItems([]);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, []),
  );

  const TIPO_CONFIG: Record<string, TipoConfig> = {
    sena_texto: { label: t('historySenaTexto'), icon: 'hand-left', color: '#8B5CF6', darkColor: '#A78BFA' },
    texto_sena: { label: t('historyTextoSena'), icon: 'text',      color: '#2563EB', darkColor: '#60A5FA' },
    voz_sena:   { label: t('historyVozSena'),   icon: 'mic',       color: '#059669', darkColor: '#34D399' },
  };

  const handleDelete = useCallback(async (id: number) => {
    const ok = await showConfirm({
      title: t('historyDeleteTitle'),
      message: t('historyConfirmDelete'),
      confirmText: t('historyDeleteBtn'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await translationsService.remove(id);
      setItems(prev => prev.filter(item => item.id_traduccion !== id));
    } catch {
      await showAlert({ title: t('error'), message: t('historyDeleteError'), icon: 'error' });
    }
  }, [t]);

  const handleReuse = useCallback((item: HistoryItem) => {
    showAlert({ title: t('historyReuseTitle'), message: `${t('historyReuseMsg')}\n\n"${item.texto_entrada}"` });
  }, [t]);

  const renderItem: ListRenderItem<HistoryItem> = useCallback(({ item }) => {
    const config = TIPO_CONFIG[item.tipo] ?? TIPO_CONFIG['texto_sena'];
    const badgeColor = isDark ? config.darkColor : config.color;
    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + '1F' }]}>
            <Ionicons name={config.icon} size={13} color={badgeColor} />
            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{config.label}</Text>
          </View>
          <Text style={[styles.cardDate, { color: C.textHint }]}>
            {item.fecha_traduccion} · {item.hora}
          </Text>
        </View>

        <Text style={[styles.cardText, { color: C.textPrimary }]} numberOfLines={3}>{item.texto_entrada}</Text>

        <View style={[styles.cardFooter, { borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.reuseBtn, { borderColor: C.borderInput }]}
            onPress={() => handleReuse(item)}
          >
            <Ionicons name="refresh-outline" size={16} color={C.primary} />
            <Text style={[styles.reuseText, { color: C.primary }]}>{t('historyReuseBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id_traduccion)}
          >
            <Ionicons name="trash-outline" size={17} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleDelete, handleReuse, C, isDark, t, TIPO_CONFIG]);

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />

      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={[styles.title, { color: C.textPrimary }]}>{t('historyTitle')}</Text>
          </View>
          <View style={[styles.countPill, { backgroundColor: C.surface, borderColor: C.borderInput }]}>
            <Ionicons name="layers-outline" size={16} color={C.primaryDark} />
            <Text style={[styles.countText, { color: C.primaryDark }]}>{items.length} {t('historyRecords')}</Text>
          </View>
        </View>

        {/* Buscador */}
        <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.borderInput }]}>
          <Ionicons name="search-outline" size={20} color={C.primary} />
          <TextInput
            style={[styles.searchInput, { color: C.textPrimary }, { outlineStyle: 'none' } as any]}
            value={query}
            onChangeText={setQuery}
            placeholder={t('historyFilter')}
            placeholderTextColor={C.textHint}
          />
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="file-tray-outline" size={40} color={C.primaryLighter} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>{t('historyEmpty')}</Text>
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>{t('historyEmptyText')}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            key={numCols}
            numColumns={numCols}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundGray },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12, maxWidth: 1080, width: '100%', alignSelf: 'center' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  heroLeft: { flexShrink: 1 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1,
  },
  countText: { fontSize: 14, fontWeight: '800' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    height: 54, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15 },

  columnWrapper: { gap: 18 },
  list: { gap: 18, paddingBottom: 28 },

  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
  },
  typeBadgeText: { fontSize: 12, fontWeight: '800' },
  cardDate: { fontSize: 12, fontWeight: '700' },
  cardText: { fontSize: 17, fontWeight: '700', lineHeight: 24, marginBottom: 16 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingTop: 14, borderTopWidth: 1,
  },
  reuseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 42, borderRadius: 10, borderWidth: 1.5,
  },
  reuseText: { fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: '#F3D3D3',
    alignItems: 'center', justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
});
