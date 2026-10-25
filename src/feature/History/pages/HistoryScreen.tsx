
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
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParams } from '../../../app/routes/MainTabNavigator';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../../app/config/i18n';
import { useTrackSectionView } from '../../../shared/hooks/useTrackSectionView';
import { translationsService } from '../../../feature/Translation/services/translations.service';
import { showAlert, showConfirm } from '../../../shared/utils/dialogs';
import { groupHistory, type HistoryGroup } from '../services/groupHistory';

const formatTime = (date: Date): string => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

type TipoConfig = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  darkColor: string;
};

const keyExtractor = (item: HistoryGroup) => item.key;

export const HistoryScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numCols = isTablet ? 2 : 1;
  const C = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParams, 'History'>>();
  useTrackSectionView('HISTORY');
  // El modo Palabras guarda una fila por palabra: aqui se agrupan por sesion.
  const [items, setItems] = useState<HistoryGroup[]>([]);
  // Sesion abierta en el modal con todas sus palabras.
  const [detail, setDetail] = useState<HistoryGroup | null>(null);
  const [loading, setLoading] = useState(true);
  // Un fallo de red no es un historial vacio: se muestra el error con reintento.
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState<string>('');

  const filtered = items.filter((p) =>
    p.phrase.toLowerCase().includes(query.toLowerCase())
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const rows = await translationsService.list({ limit: 100 });
          if (active) {
            setItems(groupHistory(rows));
            setFailed(false);
          }
        } catch {
          if (active) setFailed(true);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [reloadKey]),
  );

  const retry = useCallback(() => {
    setLoading(true);
    setFailed(false);
    setReloadKey(k => k + 1);
  }, []);

  const TIPO_CONFIG: Record<string, TipoConfig> = {
    sena_texto: { label: t('historySenaTexto'), icon: 'hand-left', color: '#8B5CF6', darkColor: '#A78BFA' },
    texto_sena: { label: t('historyTextoSena'), icon: 'text',      color: '#2563EB', darkColor: '#60A5FA' },
    voz_sena:   { label: t('historyVozSena'),   icon: 'mic',       color: '#059669', darkColor: '#34D399' },
  };

  const handleDelete = useCallback(async (group: HistoryGroup) => {
    const ok = await showConfirm({
      title: t('historyDeleteTitle'),
      message: group.ids.length > 1 ? t('historyConfirmDeleteSession', { n: group.ids.length }) : t('historyConfirmDelete'),
      confirmText: t('historyDeleteBtn'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!ok) return;
    // La API no borra por sesion: se borra cada palabra y se quitan de la pantalla
    // solo las que si se borraron, para no esconder filas que siguen guardadas.
    const results = await Promise.allSettled(group.ids.map(id => translationsService.remove(id)));
    const removed = new Set(group.ids.filter((_, i) => results[i].status === 'fulfilled'));
    setItems(prev => prev.flatMap(item => {
      if (item.key !== group.key) return [item];
      const words = item.words.filter(w => !removed.has(w.id));
      if (words.length === 0) return [];
      return [{ ...item, ids: words.map(w => w.id), words, phrase: words.map(w => w.word).join(' ') }];
    }));
    if (removed.size < group.ids.length) {
      await showAlert({ title: t('error'), message: t('historyDeleteError'), icon: 'error' });
    }
  }, [t]);

  const handleReuse = useCallback(async (item: HistoryGroup) => {
    await showAlert({ title: t('historyReuseTitle'), message: `${t('historyReuseMsg')}\n\n"${item.phrase}"` });
    navigation.navigate('Translation');
  }, [t, navigation]);

  const renderItem: ListRenderItem<HistoryGroup> = useCallback(({ item }) => {
    const config = TIPO_CONFIG[item.type] ?? TIPO_CONFIG['texto_sena'];
    const badgeColor = isDark ? config.darkColor : config.color;
    const start = formatTime(item.start);
    const end = formatTime(item.end);
    const isSession = item.words.length > 1;
    return (
      <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + '1F' }]}>
            <Ionicons name={config.icon} size={13} color={badgeColor} />
            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{config.label}</Text>
          </View>
          <Text style={[styles.cardDate, { color: C.textHint }]}>
            {item.start.toLocaleDateString()} · {start === end ? start : `${start} – ${end}`}
          </Text>
        </View>

        <Text style={[styles.cardText, { color: C.textPrimary }]} numberOfLines={3}>{item.phrase}</Text>

        {isSession && (
          <TouchableOpacity
            style={styles.wordsToggle}
            onPress={() => setDetail(item)}
            accessibilityRole="button"
          >
            <Ionicons name="chatbubbles-outline" size={15} color={C.textSecondary} />
            <Text style={[styles.wordsToggleText, { color: C.textSecondary }]}>
              {t('historyWordCount', { n: item.words.length })}
            </Text>
            <Text style={[styles.wordsToggleText, { color: C.primary }]}>{t('historyShowWords')}</Text>
            <Ionicons name="open-outline" size={14} color={C.primary} />
          </TouchableOpacity>
        )}

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
            onPress={() => handleDelete(item)}
            accessibilityRole="button"
            accessibilityLabel={t('historyDeleteBtn')}
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

        {/* El backend borra las traducciones a los 30 dias (retencion de recognition-service). */}
        <View style={styles.retentionNote}>
          <Ionicons name="time-outline" size={15} color={C.textHint} />
          <Text style={[styles.retentionText, { color: C.textHint }]}>{t('historyRetentionNote')}</Text>
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
        ) : failed && items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={40} color={C.textHint} />
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>{t('historyLoadError')}</Text>
            <TouchableOpacity onPress={retry} style={[styles.retryBtn, { backgroundColor: C.primary }]}>
              <Text style={styles.retryText}>{t('historyRetry')}</Text>
            </TouchableOpacity>
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

      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setDetail(null)}>
          {/* Pressable vacio: un toque dentro de la tarjeta no cierra el modal. */}
          <Pressable style={[styles.modalCard, { backgroundColor: C.surface, borderColor: C.border }]} onPress={() => {}}>
            {detail && (
              <>
                <View style={styles.modalHead}>
                  <View style={styles.modalHeadText}>
                    <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
                      {t('historyWordCount', { n: detail.words.length })}
                    </Text>
                    <Text style={[styles.cardDate, { color: C.textHint }]}>
                      {detail.start.toLocaleDateString()} · {formatTime(detail.start)} – {formatTime(detail.end)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetail(null)} accessibilityRole="button" accessibilityLabel={t('close')}>
                    <Ionicons name="close" size={24} color={C.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.wordList}>
                  {detail.words.map(w => (
                    <View key={w.id} style={[styles.wordChip, { backgroundColor: C.inputBg }]}>
                      <Text style={[styles.wordChipText, { color: C.textPrimary }]}>{w.word}</Text>
                      {w.confidence != null && (
                        <Text style={[styles.wordChipPct, { color: C.textHint }]}>{Math.round(Number(w.confidence) * 100)}%</Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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

  retentionNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 12 },
  retentionText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },

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
  wordsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 14, alignSelf: 'flex-start' },
  wordsToggleText: { fontSize: 13, fontWeight: '700' },
  wordList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 560, maxHeight: '80%', borderRadius: 20, borderWidth: 1, padding: 22 },
  modalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  modalHeadText: { flexShrink: 1, gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalScroll: { flexGrow: 0 },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  wordChipText: { fontSize: 13, fontWeight: '700' },
  wordChipPct: { fontSize: 11, fontWeight: '600' },
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
  retryBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
