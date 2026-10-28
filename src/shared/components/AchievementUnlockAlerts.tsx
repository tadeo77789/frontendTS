import { Ionicons } from '@expo/vector-icons';
import { dailyChallengeService, DailyChallenge } from '../../feature/Profile/services/dailyChallenge.service';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { notificationsService } from '../services/notifications.service';

type Notice = { id: string; kind: 'achievement'; progress: PersistedAchievementProgress }
  | { id: string; kind: 'challenge'; challenge: DailyChallenge & { reward: { points: number; grantedAt: string } } };

/** La referencia inicial de sesión descarta entregas sin conexión para evitar repetir históricos. */
export function AchievementUnlockAlerts() {
  const { token, sessionGeneration, isSessionCurrent } = useAuth();
  const access = useAccess();
  const { preferences, loading, saving, error } = usePreferences();
  const enabled = !!token && !access.isLoading && !access.error && !access.permissions.includes('users.manage')
    && !loading && !saving && !error && preferences?.notificationsEnabled === true;
  // La clave del hijo vacía la cola al cambiar el token, la generación o la elegibilidad.
  return enabled ? <SessionAlerts key={`${sessionGeneration}:${token}`} token={token!}
    current={() => isSessionCurrent(sessionGeneration)} /> : null;
}

function SessionAlerts({ token, current }: { token: string; current: () => boolean }) {
  const C = useColors();
  const { t, language } = useTranslation();
  const { textOf } = useAchievementText();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 1024;
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
    let challengeBaseline: string | null = null;
    const seen = new Set<string>();
    let controller = new AbortController();
    const active = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
      && (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState !== 'hidden')
      && (Platform.OS !== 'web' || typeof navigator === 'undefined' || navigator.onLine !== false);
    const valid = (generation: number) => alive && currentRef.current() && generation === epoch && active();
    const reset = () => { controller.abort(); controller = new AbortController(); epoch++; baseline = null; seen.clear(); setQueue([]); setForeground(active()); };
    const check = async () => {
      if (busy || !active() || !alive || !currentRef.current()) return;
      busy = true;
      const generation = epoch;
      try {
        if (baseline === null) {
          const [items, challenge] = await Promise.all([
            profileAchievementsService.getMine(token, controller.signal), dailyChallengeService.today(token, controller.signal),
          ]);
          if (valid(generation)) {
            baseline = new Set(items.filter(p => p.achievedAt !== null).map(p => p.achievement.id));
            challengeBaseline = challenge?.completed && challenge.reward ? challenge.assignmentId ?? null : null;
          }
          return;
        }
        // Un solo lector para ambas clases de aviso, con el límite existente de 100 sin leer.
        const notifications = await notificationsService.getUnread(token, controller.signal);
        if (!valid(generation)) return;
        const candidates = notifications.filter(n => typeof n.id === 'string'
          && n.channel === 'IN_APP' && n.status === 'SENT' && !n.readAt && !seen.has(n.referenceId)
          && ((n.referenceType === 'ACHIEVEMENT' && !baseline!.has(n.referenceId))
            || (n.referenceType === 'CHALLENGE' && n.typeCode === 'CHALLENGE_COMPLETED' && n.referenceId !== challengeBaseline)));
        if (!candidates.length) return;
        const [items, challenge] = await Promise.all([
          candidates.some(n => n.referenceType === 'ACHIEVEMENT') ? profileAchievementsService.getMine(token, controller.signal) : [],
          candidates.some(n => n.referenceType === 'CHALLENGE') ? dailyChallengeService.today(token, controller.signal) : null,
        ]);
        if (!valid(generation)) return;
        const notices: Notice[] = [];
        for (const n of candidates.reverse()) {
          if (n.referenceType === 'CHALLENGE') {
            // La referencia debe corresponder al reto persistido y a su recompensa, incluso si vale cero.
            if (challenge?.assignmentId !== n.referenceId) {
              // Los retos de otro día no se revalidan en cada intervalo del lector.
              seen.add(n.referenceId); continue;
            }
            if (!challenge.completed || !challenge.completedAt || !challenge.reward || seen.has(n.referenceId)) continue;
            seen.add(n.referenceId);
            notices.push({ id: n.id, kind: 'challenge', challenge: { ...challenge, reward: challenge.reward } });
            continue;
          }
          const progress = items.find(p => p.achievement.id === n.referenceId && p.achievedAt !== null
            && p.achievement.isActive && p.achievement.availability === 'available');
          if (!progress || seen.has(n.referenceId)) continue;
          seen.add(n.referenceId);
          notices.push({ id: n.id, kind: 'achievement', progress });
        }
        setQueue(previous => [...previous, ...notices]);
      } catch {
        // Al reconectar se renueva la referencia para descartar los logros acumulados sin conexión.
        if (valid(generation)) reset();
      } finally { busy = false; }
    };
    const resume = () => { reset(); void check(); };
    // Una reconexión web invalida respuestas y cola del intervalo sin conexión.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('offline', resume); window.addEventListener('online', resume);
    }
    const subscription = AppState.addEventListener('change', resume);
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', resume);
    void check();
    const timer = setInterval(() => { void check(); }, 20000);
    return () => {
      alive = false; controller.abort(); clearInterval(timer); subscription.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('offline', resume); window.removeEventListener('online', resume);
      }
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', resume);
    };
  }, [token]);

  useEffect(() => {
    if (!notice || !foreground || !currentRef.current()) return;
    let alive = true;
    const controller = new AbortController();
    // Un fallo de la API de accesibilidad tampoco debe dejar la tarjeta invisible.
    opacity.setValue(1);
    // Primero presenta la tarjeta y deja terminar la entrada (180 ms). Una tarjeta
    // retirada antes no se acusa como leída; un fallo de lectura no bloquea controles.
    const acknowledge = setTimeout(() => {
      if (alive && currentRef.current()) void notificationsService.markRead(notice.id, token, controller.signal).catch(() => undefined);
    }, 250);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!alive || !currentRef.current()) return;
      opacity.setValue(reduced ? 1 : 0);
      if (!reduced) Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }).catch(() => undefined);
    const timer = setTimeout(() => setQueue(previous => previous.slice(1)), 6500);
    return () => { alive = false; controller.abort(); clearTimeout(timer); clearTimeout(acknowledge); opacity.stopAnimation(); };
  }, [notice?.id, foreground, token, opacity]);

  if (!notice || !foreground || !currentRef.current()) return null;
  const name = notice.kind === 'achievement' ? textOf(notice.progress).name
    : notice.challenge.localizations?.[language]?.name ?? notice.challenge.name;
  const title = t(notice.kind === 'achievement' ? 'achievementUnlocked' : 'dailyChallengeCompletedAlert');
  const rewardText = notice.kind === 'challenge' ? t('dailyChallengeGrantedPoints').replace('{points}', String(notice.challenge.reward.points)) : '';
  return <View testID="achievement-alert-overlay" pointerEvents="box-none"
    style={[styles.overlay, achievementAlertPosition(width, insets, isWide)]}>
    <Animated.View style={[styles.card, { opacity, backgroundColor: C.surface, borderColor: C.primary }]}>
      {notice.kind === 'achievement' ? <AchievementMedal achievement={notice.progress} size={44} />
        : <Ionicons name="checkmark-circle" size={44} color={C.primary} />}
      <View accessible accessibilityLabel={`${title}: ${name}. ${rewardText}`} accessibilityLiveRegion="polite" style={styles.text}><Text style={{ color: C.primary }}>{title}</Text>
        <Text style={{ color: C.textPrimary, fontWeight: '600' }}>{name}</Text>{notice.kind === 'challenge' && <Text style={{ color: C.textPrimary }}>{rewardText}</Text>}</View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={8}
        onPress={() => setQueue(previous => previous.slice(1))} style={styles.close}>
        <Text style={{ color: C.textPrimary, fontSize: 22 }}>×</Text>
      </Pressable>
    </Animated.View>
  </View>;
}
// El aviso flota sobre la pantalla: no empuja el contenido ni deja una franja vacía.
export function achievementAlertPosition(_width: number, insets: { top?: number; bottom: number; left: number; right: number }, isWide: boolean) {
  return {
    paddingTop: Math.max(insets.top ?? 0, 12), paddingBottom: 12,
    paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12),
    alignItems: isWide ? 'flex-end' as const : 'center' as const,
  };
}
const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, elevation: 10, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1,
    borderRadius: 16, maxWidth: 440, width: '100%',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.18)' },
      default: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18, shadowRadius: 12 },
    }) },
  text: { flex: 1 }, close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
