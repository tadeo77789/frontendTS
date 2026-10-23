import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../app/providers/AuthContext';
import { useAccess } from '../../app/providers/AccessContext';
import { usePreferences } from '../../app/providers/PreferencesContext';
import { useColors } from '../../app/providers/ThemeContext';
import { useTranslation } from '../../app/config/i18n';
import { profileAchievementsService } from '../../feature/Profile/services/profileAchievements.service';
import { AchievementMedal } from '../../feature/Profile/components/AchievementMedal';
import { useAchievementText } from '../../feature/Profile/hooks/useAchievementText';
import { PersistedAchievementProgress } from '../../feature/Profile/data/persistedAchievements';
import { api } from '../services/api.client';

interface Notice { id: string; progress: PersistedAchievementProgress }
interface Notification { id: string; referenceType: string; referenceId: string; channel: string; readAt?: string; status: string }

/** A session baseline deliberately sacrifices offline delivery to avoid historical replays. */
export function AchievementUnlockAlerts() {
  const { token, sessionGeneration, isSessionCurrent } = useAuth();
  const access = useAccess();
  const { preferences, loading, saving, error } = usePreferences();
  const enabled = !!token && !access.isLoading && !access.error && !access.permissions.includes('users.manage')
    && !loading && !saving && !error && preferences?.notificationsEnabled === true;
  // A keyed child clears the queue synchronously on token/generation or eligibility changes.
  return enabled ? <SessionAlerts key={`${sessionGeneration}:${token}`} token={token!}
    current={() => isSessionCurrent(sessionGeneration)} /> : null;
}

function SessionAlerts({ token, current }: { token: string; current: () => boolean }) {
  const C = useColors();
  const { t } = useTranslation();
  const { textOf } = useAchievementText();
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<Notice[]>([]);
  const [foreground, setForeground] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const currentRef = useRef(current);
  currentRef.current = current;
  const opacity = useRef(new Animated.Value(1)).current;
  const notice = queue[0];

  useEffect(() => {
    let alive = true;
    let epoch = 0;
    let busy = false;
    let baseline: Set<string> | null = null;
    const seen = new Set<string>();
    const controller = new AbortController();
    const headers = { Authorization: `Bearer ${token}` };
    const active = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
      && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState !== 'hidden');
    const valid = (generation: number) => alive && currentRef.current() && generation === epoch && active();
    const reset = () => { epoch++; baseline = null; seen.clear(); setQueue([]); setForeground(active()); };
    const check = async () => {
      if (busy || !active() || !alive || !currentRef.current()) return;
      busy = true;
      const generation = epoch;
      try {
        if (baseline === null) {
          const items = await profileAchievementsService.getMine(token, controller.signal);
          if (valid(generation)) baseline = new Set(items.filter(p => p.achievedAt !== null).map(p => p.achievement.id));
          return;
        }
        // The catalogue has 21 achievements; 100 unread notifications bounds each check.
        const response = await api.get('/notifications', { headers, signal: controller.signal,
          params: { unreadOnly: true, limit: 100 } });
        if (!valid(generation) || !Array.isArray(response.data?.data)) return;
        const candidates = (response.data.data as Notification[]).filter(n => typeof n.id === 'string'
          && n.channel === 'IN_APP' && n.referenceType === 'ACHIEVEMENT' && n.status === 'SENT'
          && !n.readAt && !seen.has(n.referenceId) && !baseline!.has(n.referenceId));
        if (!candidates.length) return;
        const items = await profileAchievementsService.getMine(token, controller.signal);
        if (!valid(generation)) return;
        const notices: Notice[] = [];
        for (const n of candidates.reverse()) {
          const progress = items.find(p => p.achievement.id === n.referenceId && p.achievedAt !== null
            && p.achievement.isActive && p.achievement.availability === 'available');
          if (!progress || seen.has(n.referenceId)) continue;
          seen.add(n.referenceId);
          notices.push({ id: n.id, progress });
        }
        setQueue(previous => [...previous, ...notices]);
      } catch {
        // Reconnect starts a new baseline: no delayed burst of achievements from an outage.
        if (valid(generation)) reset();
      } finally { busy = false; }
    };
    const resume = () => { reset(); void check(); };
    const subscription = AppState.addEventListener('change', resume);
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', resume);
    void check();
    const timer = setInterval(() => { void check(); }, 20000);
    return () => {
      alive = false; controller.abort(); clearInterval(timer); subscription.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', resume);
    };
  }, [token]);

  useEffect(() => {
    if (!notice || !foreground || !currentRef.current()) return;
    let alive = true;
    const controller = new AbortController();
    // Reading the inbox is distinct from presentation. A failed acknowledgement never blocks controls.
    void api.patch(`/notifications/${encodeURIComponent(notice.id)}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).catch(() => undefined);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive || !currentRef.current()) return;
      opacity.setValue(reduced ? 1 : 0);
      if (!reduced) Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }).catch(() => undefined);
    const timer = setTimeout(() => setQueue(previous => previous.slice(1)), 6500);
    return () => { alive = false; controller.abort(); clearTimeout(timer); opacity.stopAnimation(); };
  }, [notice?.id, foreground, token, opacity]);

  if (!notice || !foreground || !currentRef.current()) return null;
  const name = textOf(notice.progress).name;
  return <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + 8 }]}>
    <Animated.View style={[styles.card, { opacity, backgroundColor: C.surface, borderColor: C.primary }]}>
      <AchievementMedal achievement={notice.progress} size={44} />
      <View accessible accessibilityLabel={`${t('achievementUnlocked')}: ${name}`} accessibilityLiveRegion="polite" style={styles.text}><Text style={{ color: C.primary }}>{t('achievementUnlocked')}</Text>
        <Text style={{ color: C.textPrimary, fontWeight: '600' }}>{name}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}
        onPress={() => setQueue(previous => previous.slice(1))} style={styles.close}>
        <Text style={{ color: C.textPrimary, fontSize: 22 }}>×</Text>
      </Pressable>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 12, right: 12, zIndex: 1000, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1,
    borderRadius: 16, maxWidth: 440, width: '100%', elevation: 6 },
  text: { flex: 1 }, close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
