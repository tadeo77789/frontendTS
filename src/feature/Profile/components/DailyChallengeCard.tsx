import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useDailyChallenge } from '../hooks/useDailyChallenge';

export function DailyChallengeCard() {
  const { enabled, data, loading, error, retry } = useDailyChallenge();
  const C = useColors();
  const { t } = useTranslation();
  if (!enabled) return null;
  // Las semillas usan texto local para respetar cambios de idioma inmediatos.
  const seeded = data && /^TRANSLATE_(1|3|5|8)$/.test(data.code);
  const name = data && (seeded ? t('dailyChallengeName', { count: data.targetCount }) : data.name);
  const description = data && (seeded ? t('dailyChallengeDescription', { count: data.targetCount }) : data.description);
  return <View testID="daily-challenge-card" style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
    <Text accessibilityRole="header" style={[styles.title, { color: C.textPrimary }]}>{t('dailyChallengeTitle')}</Text>
    {loading && <ActivityIndicator accessibilityLabel={t('loading')} color={C.primary} />}
    {error && <View accessibilityLiveRegion="polite">
      <Text style={{ color: C.textPrimary }}>{t('dailyChallengeError')}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
        <Text style={{ color: C.primary }}>{t('dailyChallengeRetry')}</Text>
      </Pressable>
    </View>}
    {!loading && !error && !data && <Text style={{ color: C.textSecondary }}>{t('dailyChallengeEmpty')}</Text>}
    {data && <View>
      <Text style={[styles.title, { color: C.textPrimary }]}>{name}</Text>
      <Text style={{ color: C.textSecondary }}>{description}</Text>
      <View accessible accessibilityRole="progressbar" accessibilityLabel={name ?? ''}
        accessibilityValue={{ min: 0, max: data.targetCount, now: data.currentCount }} style={[styles.track, { backgroundColor: C.border }]}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: C.primary, width: `${100 * data.currentCount / data.targetCount}%` }} />
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: C.textPrimary }}>
        {t('dailyChallengeProgress', { current: data.currentCount, target: data.targetCount })}
      </Text>
      <Text style={{ color: C.primary }}>{t(data.completed ? 'dailyChallengeRewarded' : 'dailyChallengePoints', { points: data.points })}</Text>
      <Text style={{ color: C.textPrimary }}>{t(data.completed ? 'dailyChallengeCompleted' : 'dailyChallengePending')}</Text>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16, gap: 8 },
  title: { fontWeight: '700', fontSize: 18, marginBottom: 6 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 12 },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 8 },
});
