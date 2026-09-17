import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import {
  ACHIEVEMENTS,
  CATEGORY_LABEL_KEYS,
  CATEGORY_ORDER,
  progressOf,
  type Achievement,
  type AchievementCategory,
} from '../data/achievements';
import { useAchievementText } from '../hooks/useAchievementText';
import { AchievementMedal } from './AchievementMedal';
import { AchievementProgressBar } from './AchievementProgressBar';
import { AchievementDetailModal } from './AchievementDetailModal';

type Filter = AchievementCategory | 'all';

const GRID_GAP = 12;
const MIN_TILE = 150;
/** Ancho real de la tarjeta antes de medirla: 20 de padding del scroll a cada
 *  lado, 880 de ancho maximo del perfil y 26 de padding de la tarjeta. */
const estimateGridWidth = (windowWidth: number) => Math.max(160, Math.min(windowWidth - 40, 880) - 52);

interface AchievementsCardProps {
  isWide: boolean;
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({ isWide }) => {
  const C = useColors();
  const { t } = useTranslation();
  const { progressText, levelText } = useAchievementText();
  const { width } = useWindowDimensions();

  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter(achievement => progressOf(achievement).unlocked).length,
    []
  );
  const totalPercent = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  // Los dos logros mas avanzados de los que aun no estan desbloqueados.
  const inProgress = useMemo(
    () =>
      ACHIEVEMENTS.map(achievement => ({ achievement, ...progressOf(achievement) }))
        .filter(entry => !entry.unlocked && entry.percent > 0)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 2),
    []
  );

  const visible = filter === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === filter);
  const open = ACHIEVEMENTS.find(a => a.id === openId) ?? null;

  const available = gridWidth || estimateGridWidth(width);
  const columns = Math.max(2, Math.floor((available + GRID_GAP) / (MIN_TILE + GRID_GAP)));
  const tileWidth = (available - GRID_GAP * (columns - 1)) / columns;

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('achievementsAll') },
    ...CATEGORY_ORDER.map(category => ({ key: category as Filter, label: t(CATEGORY_LABEL_KEYS[category]) })),
  ];

  const renderInProgress = (achievement: Achievement, percent: number) => (
    <TouchableOpacity
      key={achievement.id}
      activeOpacity={0.8}
      onPress={() => setOpenId(achievement.id)}
      style={[
        styles.inProgressRow,
        isWide && styles.inProgressRowWide,
        { backgroundColor: C.primaryBg, borderColor: C.borderInput },
      ]}
    >
      <View style={[styles.inProgressIcon, { backgroundColor: C.surface, borderColor: C.primaryLight }]}>
        <Ionicons name={achievement.icon} size={19} color={C.primaryDark} />
      </View>
      <View style={styles.inProgressBody}>
        <Text style={[styles.inProgressName, { color: C.textPrimary }]} numberOfLines={1}>
          {t(achievement.nameKey)}
        </Text>
        <View style={styles.inProgressMeter}>
          <AchievementProgressBar percent={percent} track={C.surface} fill={C.primary} height={6} />
          <Text style={[styles.inProgressValue, { color: C.textSecondary }]}>{progressText(achievement)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={15} color={C.textHint} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.header, !isWide && styles.headerStacked]}>
        <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('achievements')}</Text>
        <Text style={[styles.headerCount, { color: C.textSecondary }]}>
          {t('achievementsProgress', { unlocked: unlockedCount, total: ACHIEVEMENTS.length })}
        </Text>
        <View style={[styles.headerMeter, isWide && styles.headerMeterWide]}>
          <AchievementProgressBar percent={totalPercent} track={C.inputBg} fill={C.primary} />
          <Text style={[styles.headerPercent, { color: C.primaryDark }]}>{totalPercent}%</Text>
        </View>
      </View>

      {inProgress.length > 0 && (
        <View style={[styles.inProgressList, isWide && styles.inProgressListWide]}>
          {inProgress.map(entry => renderInProgress(entry.achievement, entry.percent))}
        </View>
      )}

      <View style={styles.filters}>
        {filters.map(({ key, label }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setFilter(key)}
              activeOpacity={0.8}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: C.primaryBg, borderColor: C.primary }
                  : { backgroundColor: C.surface, borderColor: C.border },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? C.primaryDark : C.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.grid} onLayout={event => setGridWidth(event.nativeEvent.layout.width)}>
        {visible.map(achievement => {
          const { unlocked } = progressOf(achievement);
          return (
            <TouchableOpacity
              key={achievement.id}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t(achievement.nameKey)} · ${levelText(achievement)}`}
              onPress={() => setOpenId(achievement.id)}
              style={[
                styles.tile,
                {
                  width: tileWidth,
                  backgroundColor: unlocked ? C.surface : C.backgroundGray,
                  borderColor: unlocked ? C.borderInput : C.border,
                },
              ]}
            >
              <AchievementMedal achievement={achievement} size={56} />
              <Text
                style={[styles.tileName, { color: unlocked ? C.textPrimary : C.textSecondary }]}
                numberOfLines={2}
              >
                {t(achievement.nameKey)}
              </Text>
              <Text style={[styles.tileLevel, { color: unlocked ? C.primaryDark : C.textHint }]}>
                {levelText(achievement)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visible.length === 0 && (
        <Text style={[styles.empty, { color: C.textSecondary }]}>{t('achievementsEmpty')}</Text>
      )}

      <AchievementDetailModal achievement={open} onClose={() => setOpenId(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 26 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  // En estrecho la barra no cabe junto a las dos etiquetas: se apilan.
  headerStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  headerCount: { fontSize: 13, fontWeight: '600', marginRight: 'auto' },
  headerMeter: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  headerMeterWide: { flex: 1, maxWidth: 260 },
  headerPercent: { fontSize: 13, fontWeight: '800' },

  inProgressList: { gap: GRID_GAP, marginBottom: 20 },
  inProgressListWide: { flexDirection: 'row' },
  inProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  inProgressRowWide: { flex: 1 },
  inProgressIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inProgressBody: { flex: 1, minWidth: 0 },
  inProgressName: { fontSize: 14, fontWeight: '700' },
  inProgressMeter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  inProgressValue: { fontSize: 12, fontWeight: '700' },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  filterChip: { height: 34, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  tileName: { fontSize: 13, fontWeight: '700', lineHeight: 17, textAlign: 'center' },
  tileLevel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },

  empty: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 24 },
});
