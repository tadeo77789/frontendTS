import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../app/providers/AuthContext';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';
import { CATEGORIES, persistedCatalogProgress, persistedProgressOf, type AchievementCategory, type PersistedAchievementProgress } from '../data/persistedAchievements';
import { useAchievementText } from '../hooks/useAchievementText';
import { AchievementMedal } from './AchievementMedal';
import { AchievementProgressBar } from './AchievementProgressBar';
import { AchievementDetailModal } from './AchievementDetailModal';

const labels: Record<AchievementCategory, TranslationKey> = {
  translation: 'achievementsCatTranslation', practice: 'achievementsCatPractice',
  vocabulary: 'achievementsCatVocabulary', consistency: 'achievementsCatConsistency', community: 'achievementsCatCommunity',
};
interface Props {
  achievements: PersistedAchievementProgress[] | null;
  loading: boolean; error: boolean; reload: () => Promise<void>; isWide: boolean;
}
export const AchievementsCard: React.FC<Props> = ({ achievements, loading, error, reload }) => {
  const C = useColors();
  const { t } = useTranslation();
  const { textOf, stateText, progressText } = useAchievementText();
  const { width } = useWindowDimensions();
  const { user, token, sessionGeneration, isSessionCurrent } = useAuth();
  const userId = user?.id_usuario ?? null;
  const session = useMemo(() => ({ userId, token, generation: sessionGeneration }), [userId, token, sessionGeneration]);
  const [selection, setSelection] = useState<{ id: string; session: typeof session } | null>(null);
  const [expansion, setExpansion] = useState<{ session: typeof session; categories: Record<string, boolean>; section: boolean }>({ session, categories: {}, section: false });
  // Bind expansion to the session so another account never inherits the previous view.
  const expandedCategories = expansion.session === session ? expansion.categories : {};
  const sectionExpanded = expansion.session === session && expansion.section;
  useEffect(() => { setSelection(null); setExpansion({ session, categories: {}, section: false }); }, [session]);
  const ready = !loading && !error && achievements !== null && isSessionCurrent(session.generation);
  const items = ready ? achievements : [];
  const summary = persistedCatalogProgress(items);
  const open = sectionExpanded && selection?.session === session ? items.find(p => p.achievement.id === selection.id) ?? null : null;
  const tileWidth = width >= 900 ? '23%' : width >= 600 ? '31%' : '47%';
  const groups = [...CATEGORIES.map(category => ({ key: category, label: t(labels[category]),
    items: items.filter(p => p.achievement.collection === 'catalog' && p.achievement.category === category) })),
    { key: 'legacy', label: t('achievementLegacy'), items: items.filter(p => p.achievement.collection === 'legacy') }];
  return (
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <TouchableOpacity accessibilityRole="button"
        accessibilityLabel={t(sectionExpanded ? 'achievementsCollapse' : 'achievementsExpand')}
        accessibilityState={{ expanded: sectionExpanded }}
        style={styles.sectionToggle}
        onPress={() => {
          if (sectionExpanded) setSelection(null);
          setExpansion({ session, categories: expandedCategories, section: !sectionExpanded });
        }}>
        <Text style={[styles.heading, { color: C.textPrimary }]}>{t('achievements')}</Text>
        <Ionicons name={sectionExpanded ? 'chevron-up' : 'chevron-down'} size={22} color={C.textPrimary} accessible={false} />
      </TouchableOpacity>
      {sectionExpanded && (loading ? <Text accessibilityLiveRegion="polite" style={{ color: C.textSecondary }}>{t('achievementsLoading')}</Text>
        : error ? <View><Text accessibilityLiveRegion="polite" style={{ color: C.textSecondary }}>{t('achievementsLoadError')}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => { void reload(); }}><Text style={{ color: C.primary }}>{t('statsRetry')}</Text></TouchableOpacity></View>
        : !ready ? <Text style={{ color: C.textSecondary }}>{t('achievementsUnavailable')}</Text>
        : items.length === 0 ? <Text style={{ color: C.textSecondary }}>{t('achievementsCatalogEmpty')}</Text>
        : <>
          <Text style={{ color: C.textSecondary }}>{t('achievementCatalogSummary', { total: summary.total, available: summary.available, upcoming: summary.upcoming })}</Text>
          <Text style={{ color: C.textSecondary }}>{summary.available > 0 ? t('achievementAvailableSummary', { unlocked: summary.unlocked, total: summary.available }) : t('achievementNoneAvailable')}</Text>
          {summary.percent !== null && <View style={styles.progress}><AchievementProgressBar percent={summary.percent} track={C.inputBg} fill={C.primary} /></View>}
          <Text style={{ color: C.textSecondary }}>{t('achievementLegacySummary', { unlocked: summary.legacyUnlocked, total: summary.legacyTotal })}</Text>
          {groups.filter(group => group.items.length > 0).map(group => {
            const expandable = group.key !== 'legacy' && group.items.length > 2;
            const expanded = expandedCategories[group.key] === true;
            const visibleItems = group.key === 'legacy' || expanded ? group.items : group.items.slice(0, 2);
            const toggleText = t(expanded ? 'achievementsSeeLess' : 'achievementsSeeMore', { count: group.items.length - 2 });
            return (
            <View key={group.key} style={styles.group}>
              <Text style={[styles.category, { color: C.textPrimary }]}>{group.label} ({group.items.length})</Text>
              <View style={styles.grid}>
                {visibleItems.map(p => {
                  const { unlocked, percent } = persistedProgressOf(p);
                  const text = textOf(p);
                  return <TouchableOpacity key={p.achievement.id} accessibilityRole="button"
                    accessibilityLabel={`${text.name} · ${stateText(p)}`}
                    onPress={() => setSelection({ id: p.achievement.id, session })}
                    style={[styles.tile, { width: tileWidth, backgroundColor: unlocked ? C.primaryBg : C.backgroundGray,
                      borderColor: unlocked ? C.primary : C.border }]}>
                    <AchievementMedal achievement={p} size={56} />
                    <Text style={[styles.name, { color: unlocked ? C.textPrimary : C.textSecondary }]}>{text.name}</Text>
                    <Text style={[styles.state, { color: unlocked ? C.primaryDark : C.textSecondary }]}>{stateText(p)}</Text>
                    {p.achievement.level !== null && <Text style={{ color: C.textSecondary }}>
                      {t(p.achievement.level === 'gold' ? 'achievementLevelGold' : p.achievement.level === 'silver' ? 'achievementLevelSilver' : 'achievementLevelBronze')}
                    </Text>}
                    {percent === null ? <View style={{ gap: 6 }}><Text style={[styles.reason, { color: C.textSecondary }]}>{text.description}</Text><Text style={[styles.reason, { color: C.textSecondary }]}>{text.unavailableReason}</Text></View>
                      : <><View style={styles.progress}><AchievementProgressBar percent={percent} track={C.inputBg} fill={unlocked ? C.primary : C.textHint} /></View>
                        <Text style={{ color: C.textSecondary }}>{progressText(p)}</Text></>}
                  </TouchableOpacity>;
                })}
              </View>
              {expandable && <TouchableOpacity accessibilityRole="button"
                accessibilityLabel={`${toggleText} · ${group.label}`}
                accessibilityState={{ expanded }}
                onPress={() => setExpansion({ session, section: true, categories: { ...expandedCategories, [group.key]: !expanded } })}
                style={styles.toggle}>
                <Text style={{ color: C.primary }}>{toggleText}</Text>
              </TouchableOpacity>}
            </View>
          ); })}
        </>)}
      <AchievementDetailModal achievement={open} onClose={() => setSelection(null)} />
    </View>
  );
};
const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  heading: { fontSize: 18, fontWeight: '800' }, category: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  toggle: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 4 },
  group: { marginTop: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  progress: { alignSelf: 'stretch', height: 8, flexDirection: 'row' },
  state: { fontSize: 12, fontWeight: '700', textAlign: 'center' }, reason: { fontSize: 12, textAlign: 'center' },
});
