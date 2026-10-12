import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../app/providers/AuthContext';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import {
  persistedCatalogProgress,
  persistedProgressOf,
  type PersistedAchievementProgress,
} from '../data/persistedAchievements';
import { useAchievementText } from '../hooks/useAchievementText';
import { AchievementMedal } from './AchievementMedal';
import { AchievementProgressBar } from './AchievementProgressBar';
import { AchievementDetailModal } from './AchievementDetailModal';

const GRID_GAP = 12;
const MIN_TILE = 150;
/** Medallas visibles antes de pulsar "ver mas". */
const PREVIEW_COUNT = 2;
const estimateGridWidth = (windowWidth: number) => Math.max(160, Math.min(windowWidth - 40, 880) - 52);

interface DetailSession {
  userId: number | null;
  token: string | null;
  generation: number;
}

interface AchievementsCardProps {
  achievements: PersistedAchievementProgress[] | null;
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  isWide: boolean;
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({
  isWide, achievements, loading, error, reload,
}) => {
  const C = useColors();
  const { t } = useTranslation();
  const { progressText, stateText } = useAchievementText();
  const { width } = useWindowDimensions();
  const { user, token, sessionGeneration, isSessionCurrent } = useAuth();
  const userId = user?.id_usuario ?? null;
  const session = useMemo<DetailSession>(() => ({
    userId, token, generation: sessionGeneration,
  }), [userId, token, sessionGeneration]);

  const [selection, setSelection] = useState<{
    id: string;
    session: DetailSession;
  } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);

  // El render tambien comprueba el ambito: no espera al efecto para ocultar el detalle.
  useEffect(() => {
    setSelection(null);
    setShowAll(false);
  }, [session]);

  const ready =
    !loading && !error && achievements !== null
    && isSessionCurrent(session.generation);
  const items = ready ? achievements : [];
  const summary = persistedCatalogProgress(items);
  const inProgress = items.map(achievement => ({
    achievement, ...persistedProgressOf(achievement),
  }))
    .filter(entry => !entry.unlocked && entry.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2);

  const shown = showAll ? items : items.slice(0, PREVIEW_COUNT);
  const hidden = items.length - shown.length;
  const open = selection?.session === session
    ? items.find(item => item.achievement.id === selection.id) ?? null
    : null;
  const select = (achievement: PersistedAchievementProgress) => {
    setSelection({ id: achievement.achievement.id, session });
  };

  const available = gridWidth || estimateGridWidth(width);
  const columns = Math.max(2, Math.floor((available + GRID_GAP) / (MIN_TILE + GRID_GAP)));
  const tileWidth = (available - GRID_GAP * (columns - 1)) / columns;

  const renderInProgress = (achievement: PersistedAchievementProgress, percent: number) => (
    <TouchableOpacity
      key={achievement.achievement.id}
      activeOpacity={0.8}
      accessibilityRole="button"
      onPress={() => select(achievement)}
      style={[
        styles.inProgressRow,
        isWide && styles.inProgressRowWide,
        { backgroundColor: C.primaryBg, borderColor: C.borderInput },
      ]}
    >
      <View style={[styles.inProgressIcon, { backgroundColor: C.surface, borderColor: C.primaryLight }]}>
        <Ionicons name="ribbon-outline" size={19} color={C.primary} />
      </View>
      <View style={styles.inProgressBody}>
        <Text style={[styles.inProgressName, { color: C.textPrimary }]} numberOfLines={1}>
          {achievement.achievement.name}
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
        {ready && (
          <>
            <Text style={[styles.headerCount, { color: C.textSecondary }]}>
              {t('achievementsProgress', { unlocked: summary.unlocked, total: summary.total })}
            </Text>
            <View style={[styles.headerMeter, isWide && styles.headerMeterWide]}>
              <AchievementProgressBar percent={summary.percent} track={C.inputBg} fill={C.primary} />
              <Text style={[styles.headerPercent, { color: C.primaryDark }]}>{summary.percent}%</Text>
            </View>
          </>
        )}
      </View>

      {loading ? (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: C.textSecondary }]}>
          {t('achievementsLoading')}
        </Text>
      ) : error ? (
        <View style={styles.error}>
          <Text accessibilityLiveRegion="polite" style={[styles.message, { color: C.textSecondary }]}>
            {t('achievementsLoadError')}
          </Text>
          <TouchableOpacity onPress={() => { void reload(); }} accessibilityRole="button">
            <Text style={[styles.seeMoreText, { color: C.primary }]}>{t('statsRetry')}</Text>
          </TouchableOpacity>
        </View>
      ) : !ready ? (
        <Text style={[styles.message, { color: C.textSecondary }]}>{t('achievementsUnavailable')}</Text>
      ) : items.length === 0 ? (
        <Text style={[styles.message, { color: C.textSecondary }]}>{t('achievementsCatalogEmpty')}</Text>
      ) : (
        <>
          {inProgress.length > 0 && (
            <View style={[styles.inProgressList, isWide && styles.inProgressListWide]}>
              {inProgress.map(entry => renderInProgress(entry.achievement, entry.percent))}
            </View>
          )}

          <View style={styles.grid} onLayout={event => setGridWidth(event.nativeEvent.layout.width)}>
            {shown.map(achievement => {
              const { unlocked } = persistedProgressOf(achievement);
              return (
                <TouchableOpacity
                  key={achievement.achievement.id}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${achievement.achievement.name} · ${stateText(achievement)}`}
                  onPress={() => select(achievement)}
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
                    {achievement.achievement.name}
                  </Text>
                  <Text style={[styles.tileState, { color: unlocked ? C.primaryDark : C.textHint }]}>
                    {stateText(achievement)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {(hidden > 0 || showAll) && (
            <TouchableOpacity
              onPress={() => setShowAll(value => !value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              style={[styles.seeMore, { borderColor: C.borderInput, backgroundColor: C.surface }]}
            >
              <Text style={[styles.seeMoreText, { color: C.primaryDark }]}>
                {showAll ? t('achievementsSeeLess') : t('achievementsSeeMore', { count: hidden })}
              </Text>
              <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={15} color={C.primaryDark} />
            </TouchableOpacity>
          )}
        </>
      )}

      <AchievementDetailModal achievement={open} onClose={() => setSelection(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 26 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  headerStacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  headerCount: { fontSize: 13, fontWeight: '600', marginRight: 'auto' },
  headerMeter: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  headerMeterWide: { flex: 1, maxWidth: 260 },
  headerPercent: { fontSize: 13, fontWeight: '800' },
  inProgressList: { gap: GRID_GAP, marginBottom: 20 },
  inProgressListWide: { flexDirection: 'row' },
  inProgressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  inProgressRowWide: { flex: 1 },
  inProgressIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  inProgressBody: { flex: 1, minWidth: 0 },
  inProgressName: { fontSize: 14, fontWeight: '700' },
  inProgressMeter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 7 },
  inProgressValue: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    alignItems: 'center', gap: 10, paddingVertical: 18,
    paddingHorizontal: 10, borderRadius: 14, borderWidth: 1,
  },
  tileName: { fontSize: 13, fontWeight: '700', lineHeight: 17, textAlign: 'center' },
  tileState: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  seeMore: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 46, marginTop: 16, borderRadius: 12, borderWidth: 1.5,
  },
  seeMoreText: { fontSize: 14, fontWeight: '800' },
  message: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 24 },
  error: { alignItems: 'center', gap: 8 },
});