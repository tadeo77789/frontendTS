
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useSignAgent } from '../../Translation/hooks/useSignAgent';
import {
  recordSample,
  getSampleCounts,
  clearTrainingData,
  beginGestureCapture,
  recordGesture,
  getGestureCounts,
  clearGestureLabel,
} from '../../../feature/Translation/services/vision';
import { showInfo, showError, showConfirm } from '../../../shared/utils/dialogs';
import type { AdminStackParams } from '../../../app/routes/AdminStackNavigator';

type Nav = NativeStackNavigationProp<AdminStackParams, 'Training'>;

const ALPHABET_LSC = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z', '5',
];

export const AdminTrainingScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const C = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const {
    status: agentStatus,
    lastResult: agentLastResult,
    start: agentStart,
    stop: agentStop,
  } = useSignAgent(cameraRef, { intervalMs: 1500, minConfidence: 0.7 });

  const [isActive, setIsActive] = useState(false);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [gestureWord, setGestureWord] = useState('');
  const [gestureCounts, setGestureCounts] = useState<Record<string, number>>({});
  const [recordingGesture, setRecordingGesture] = useState(false);

  const refreshCounts = useCallback(async () => {
    setSampleCounts(await getSampleCounts());
    setGestureCounts(await getGestureCounts());
  }, []);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);
  useEffect(() => () => { agentStop(); }, [agentStop]);

  const startCamera = useCallback(async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showError(t('cameraPermissionMsg'), t('cameraPermissionTitle'));
        return;
      }
    }
    setIsActive(true);
    agentStart();
  }, [permission, requestPermission, t, agentStart]);

  const stopCamera = useCallback(() => {
    agentStop();
    setIsActive(false);
  }, [agentStop]);

  const handleRecordSample = useCallback(async (label: string) => {
    const features = agentLastResult?.features;
    if (!features || features.length === 0) {
      showInfo(t('trainNoHand'));
      return;
    }
    await recordSample(label, features);
    await refreshCounts();
  }, [t, refreshCounts, agentLastResult]);

  const GESTURE_CAPTURE_MS = 2400;

  const handleRecordGesture = useCallback(async () => {
    const label = gestureWord.trim().toUpperCase();
    if (!label) {
      showInfo(t('trainGestureNeedLabel'));
      return;
    }
    if (!isActive) {
      showInfo(t('tapStartCamera'));
      return;
    }
    setRecordingGesture(true);
    beginGestureCapture();
    await new Promise(resolve => setTimeout(resolve, GESTURE_CAPTURE_MS));
    const ok = await recordGesture(label);
    setRecordingGesture(false);
    if (!ok) {
      showError(t('trainGestureNoMotion'));
      return;
    }
    await refreshCounts();
    showInfo(t('trainGestureSaved').replace('{label}', label));
  }, [gestureWord, isActive, t, refreshCounts]);

  const handleDeleteGesture = useCallback(async (label: string) => {
    const ok = await showConfirm({
      title: t('trainGestureDeleteTitle'),
      message: t('trainGestureDeleteConfirm').replace('{label}', label),
      icon: 'warning',
      confirmText: t('trainConfirmDelete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!ok) return;
    await clearGestureLabel(label);
    await refreshCounts();
  }, [t, refreshCounts]);

  const handleClearTraining = useCallback(async () => {
    const total = Object.values(sampleCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const firstOk = await showConfirm({
      title: t('trainClearAll'),
      message: t('trainClearConfirm'),
      icon: 'warning',
      confirmText: t('trainContinue'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!firstOk) return;

    const secondOk = await showConfirm({
      title: t('trainClearAll'),
      message: t('trainClearConfirmSecond').replace('{count}', String(total)),
      icon: 'warning',
      confirmText: t('trainConfirmDelete'),
      cancelText: t('cancel'),
      destructive: true,
    });
    if (!secondOk) return;

    await clearTrainingData();
    await refreshCounts();
  }, [sampleCounts, t, refreshCounts]);

  const cameraGranted = permission?.granted ?? false;
  const totalSamples = Object.values(sampleCounts).reduce((a, b) => a + b, 0);
  const lettersTrained = Object.keys(sampleCounts).filter(k => sampleCounts[k] > 0).length;

  const STATUS_LABEL: Record<string, string> = {
    idle: t('tapStartCamera'),
    starting: t('agentStarting'),
    detecting: t('agentDetecting'),
    low_confidence: t('agentLowConfidence'),
    no_hands: t('agentNoHands'),
    error: t('agentError'),
  };

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>

          {/* Hero */}
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={17} color={C.primaryDark} />
              <Text style={[styles.backLinkText, { color: C.primaryDark }]}>{t('adminBack')}</Text>
            </TouchableOpacity>
            <View style={[styles.heroBadge, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="barbell-outline" size={14} color={C.primary} />
              <Text style={[styles.heroBadgeText, { color: C.primaryDark }]}>{t('trainTitle')}</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Captura de muestras</Text>
          </View>

          <View style={[styles.grid, isDesktop && styles.gridWide]}>
            {/* Columna izquierda: cámara + captura */}
            <View style={[styles.col, isDesktop && styles.colLeft]}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>{t('trainTitle')}</Text>
                    <Text style={[styles.cardSub, { color: C.textHint }]}>{t('trainHint')}</Text>
                  </View>
                </View>

                <View style={styles.cameraInner}>
                  {isActive && cameraGranted && (
                    <CameraView ref={cameraRef} style={styles.cameraFill} facing="front" />
                  )}
                  {!isActive && (
                    <Ionicons name="person-outline" size={110} color="rgba(255,255,255,0.14)" />
                  )}
                  <View style={styles.dashedFrame} pointerEvents="none" />
                  {isActive && (
                    <View style={styles.capturingBadge}>
                      <View style={styles.recDot} />
                      <Text style={styles.capturingText}>{STATUS_LABEL[agentStatus]}</Text>
                    </View>
                  )}
                  <View style={styles.lastBox}>
                    <Text style={styles.lastBoxText}>{agentLastResult?.text || '—'}</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={isActive ? stopCamera : startCamera} activeOpacity={0.9} style={styles.actionWrap}>
                  <LinearGradient
                    colors={isActive ? ['#F87171', '#EF4444'] : C.gradientPrimary}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.actionBtn}
                  >
                    <Ionicons name={isActive ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{isActive ? t('stopCamera') : t('startCamera')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={[styles.subLabel, { color: C.textHint }]}>{t('adminSamplesPerLetter')}</Text>
                <View style={styles.alphabetGrid}>
                  {ALPHABET_LSC.map(letter => {
                    const count = sampleCounts[letter] ?? 0;
                    const trained = count > 0;
                    return (
                      <TouchableOpacity
                        key={letter}
                        style={[styles.letterBtn, { backgroundColor: trained ? C.primaryBg : C.backgroundGray, borderColor: trained ? C.primary : C.border, opacity: isActive ? 1 : 0.5 }]}
                        onPress={() => handleRecordSample(letter)}
                        activeOpacity={0.7}
                        disabled={!isActive}
                      >
                        <Text style={[styles.letterBtnText, { color: trained ? C.primary : C.textPrimary }]}>{letter}</Text>
                        {count > 0 && (
                          <View style={[styles.letterCountBadge, { backgroundColor: C.primary }]}>
                            <Text style={styles.letterCountText}>{count}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Columna derecha: stats + gestos + limpiar */}
            <View style={[styles.col, isDesktop && styles.colRight]}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <Text style={[styles.statValue, { color: C.textPrimary }]}>{totalSamples}</Text>
                  <Text style={[styles.statLabel, { color: C.textHint }]}>{t('trainTotalSamples')}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <Text style={[styles.statValue, { color: C.textPrimary }]}>{lettersTrained}/{ALPHABET_LSC.length}</Text>
                  <Text style={[styles.statLabel, { color: C.textHint }]}>{t('trainLettersCovered')}</Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('trainGestureTitle')}</Text>
                <Text style={[styles.cardSub, { color: C.textSecondary, marginBottom: 14 }]}>{t('trainGestureHint')}</Text>
                <View style={styles.gestureRow}>
                  <TextInput
                    style={[styles.gestureInput, { backgroundColor: C.backgroundGray, borderColor: C.border, color: C.textPrimary }, { outlineStyle: 'none' } as any]}
                    placeholder={t('trainGesturePlaceholder')}
                    placeholderTextColor={C.textHint}
                    value={gestureWord}
                    onChangeText={setGestureWord}
                    autoCapitalize="characters"
                    editable={!recordingGesture}
                  />
                  <TouchableOpacity
                    style={[styles.gestureRecordBtn, { backgroundColor: recordingGesture ? '#EF4444' : C.primary, opacity: isActive ? 1 : 0.5 }]}
                    onPress={handleRecordGesture}
                    activeOpacity={0.85}
                    disabled={!isActive || recordingGesture}
                  >
                    <Ionicons name={recordingGesture ? 'radio-button-on' : 'videocam-outline'} size={16} color="#fff" />
                    <Text style={styles.gestureRecordText}>{recordingGesture ? t('trainGestureRecording') : t('trainGestureRecord')}</Text>
                  </TouchableOpacity>
                </View>
                {Object.keys(gestureCounts).length > 0 && (
                  <View style={styles.gestureList}>
                    {Object.entries(gestureCounts).map(([label, count]) => (
                      <View key={label} style={[styles.gestureChip, { backgroundColor: C.primaryBg, borderColor: C.primary }]}>
                        <Text style={[styles.gestureChipText, { color: C.primary }]}>{label} × {count}</Text>
                        <TouchableOpacity onPress={() => handleDeleteGesture(label)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Ionicons name="close-circle" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: '#F3D3D3', backgroundColor: C.surface, opacity: totalSamples === 0 ? 0.5 : 1 }]}
                onPress={handleClearTraining}
                activeOpacity={0.85}
                disabled={totalSamples === 0}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.clearBtnText}>{t('trainClearAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 1200, alignSelf: 'center', gap: 20 },

  hero: { gap: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backLinkText: { fontSize: 14, fontWeight: '700' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },

  grid: { gap: 20 },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 20 },
  colLeft: { flex: 1.1 },
  colRight: { flex: 0.9 },

  card: { borderRadius: 20, borderWidth: 1, padding: 24 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },

  cameraInner: { position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: 4 / 3, backgroundColor: '#2A2140', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  cameraFill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  dashedFrame: { position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderWidth: 2, borderColor: 'rgba(190,158,244,0.55)', borderStyle: 'dashed', borderRadius: 16 },
  capturingBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#EF4444' },
  capturingText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  lastBox: { position: 'absolute', top: 16, right: 16, minWidth: 54, height: 54, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  lastBoxText: { color: '#fff', fontSize: 24, fontWeight: '900' },

  actionWrap: { borderRadius: 12, overflow: 'hidden', marginBottom: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  subLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  alphabetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letterBtn: { width: 44, height: 44, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  letterBtnText: { fontSize: 15, fontWeight: '800' },
  letterCountBadge: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  letterCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 22 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  gestureRow: { flexDirection: 'row', gap: 10 },
  gestureInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15, fontWeight: '700' },
  gestureRecordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16, borderRadius: 12, height: 48 },
  gestureRecordText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  gestureList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  gestureChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  gestureChipText: { fontSize: 13, fontWeight: '800' },

  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 12, borderWidth: 1.5 },
  clearBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
