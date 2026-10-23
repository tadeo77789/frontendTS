
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';
import { useSignAgent } from '../../Translation/hooks/useSignAgent';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';
import {
  recordSample,
  getSampleCounts,
  clearTrainingData,
  gestureEngine,
  setSampleSink,
  wordState,
} from '../../../feature/Translation/services/vision';
import { wordTakeStore } from '../../Translation/services/vision/wordTakeStore';
import {
  deleteWordTemplates,
  fetchWordTemplates,
  loadWordTemplates,
  uploadWordTakes,
} from '../../Translation/services/wordTemplates.service';
import { showInfo, showError, showConfirm } from '../../../shared/utils/dialogs';
import type { AdminStackParams } from '../../../app/routes/AdminStackNavigator';

type Nav = NativeStackNavigationProp<AdminStackParams, 'Training'>;

const ALPHABET_LSC = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z',
];

/** El entrenamiento se divide en dos secciones que comparten la misma camara. */
type Section = 'alphabet' | 'words';

const SECTIONS: { key: Section; labelKey: TranslationKey; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'alphabet', labelKey: 'trainTabAlphabet', icon: 'text-outline' },
  { key: 'words',    labelKey: 'trainTabWords',    icon: 'chatbubbles-outline' },
];

/** Tomas de una palabra para darla por aprendida. */
const TAKES_PER_WORD = 5;

/** Si en este tiempo no llega una sena completa, la toma se da por perdida. */
const TAKE_TIMEOUT_MS = 10_000;

/** Fraccion minima de frames con mano, la misma que exige el motor al traducir. */
const MIN_HAND_RATIO = 0.6;

/** Las palabras se graban con el motor del modelo propio, que corre en el navegador. */
const WORDS_SUPPORTED = Platform.OS === 'web';

type WordEngineStatus = 'loading' | 'quieto' | 'senando' | 'analizando';

const ProgressMeter: React.FC<{ percent: number; track: string; fill: string }> = ({ percent, track, fill }) => (
  <View style={[styles.meterTrack, { backgroundColor: track }]}>
    <View style={[styles.meterFill, { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: fill }]} />
  </View>
);

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

  const [section, setSection] = useState<Section>('words');
  const [isActive, setIsActive] = useState(false);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [gestureWord, setGestureWord] = useState('');
  /** Tomas grabadas en este dispositivo que aun no se suben. */
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  /** Tomas que ya estan en el servidor y usa la traduccion. */
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});
  const [recordingGesture, setRecordingGesture] = useState(false);
  const [wordStatus, setWordStatus] = useState<WordEngineStatus>('loading');
  const [syncing, setSyncing] = useState(false);
  // La caja de la palabra queda al final de la pagina: al abrirse el teclado
  // tapaba el campo y no se veia lo que se escribia.
  const { scrollRef, handleInputFocus } = useScrollToInput(140);

  /** Palabra que espera su toma; el motor la entrega cuando termina la sena. */
  const armedLabelRef = useRef<string | null>(null);
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCounts = useCallback(async () => {
    setSampleCounts(await getSampleCounts());
    setPendingCounts(await wordTakeStore.countByLabel());
    try {
      const counts: Record<string, number> = {};
      for (const tpl of await fetchWordTemplates()) counts[tpl.label] = (counts[tpl.label] ?? 0) + 1;
      setServerCounts(counts);
    } catch {
      // Sin red se siguen mostrando las tomas locales.
    }
  }, []);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const disarmTake = useCallback(() => {
    armedLabelRef.current = null;
    if (armTimerRef.current) clearTimeout(armTimerRef.current);
    armTimerRef.current = null;
    setRecordingGesture(false);
  }, []);

  // El motor entrega cada sena ya recortada y remuestreada a 30 frames: lo
  // mismo que vera al traducir. Se lee por ref porque el sink se registra una
  // sola vez al encender la camara.
  const onTake = useCallback((sena: Float32Array[]) => {
    const label = armedLabelRef.current;
    if (!label) return;
    disarmTake();

    const withHand = sena.filter(f => f[126] > 0.5 || f[127] > 0.5).length;
    if (withHand / sena.length < MIN_HAND_RATIO) {
      showError(t('trainNoHand'));
      return;
    }
    void wordTakeStore
      .add(label, sena)
      .then(refreshCounts)
      .then(() => showInfo(t('trainGestureSaved').replace('{label}', label)))
      .catch(() => showError(t('genericError')));
  }, [disarmTake, refreshCounts, t]);
  const onTakeRef = useRef(onTake);
  onTakeRef.current = onTake;

  const stopWordEngine = useCallback(() => {
    disarmTake();
    setSampleSink(null);
    gestureEngine.stop();
  }, [disarmTake]);

  useEffect(() => () => { agentStop(); stopWordEngine(); }, [agentStop, stopWordEngine]);

  const startCamera = useCallback(async () => {
    if (section === 'words' && !WORDS_SUPPORTED) {
      showInfo(t('trainWordsWebOnly'), t('trainGestureTitle'));
      return;
    }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showError(t('cameraPermissionMsg'), t('cameraPermissionTitle'));
        return;
      }
    }
    setIsActive(true);
    if (section === 'alphabet') {
      agentStart();
      return;
    }
    setWordStatus('loading');
    setSampleSink(sena => onTakeRef.current(sena));
    try {
      await gestureEngine.start(() => {});
      setWordStatus('quieto');
    } catch {
      stopWordEngine();
      setIsActive(false);
      showError(t('agentError'));
    }
  }, [section, permission, requestPermission, t, agentStart, stopWordEngine]);

  const stopCamera = useCallback(() => {
    agentStop();
    stopWordEngine();
    setIsActive(false);
  }, [agentStop, stopWordEngine]);

  // Cada seccion usa su propio motor: al cambiar de pestaña se apaga la camara.
  const changeSection = useCallback((next: Section) => {
    if (next === section) return;
    stopCamera();
    setSection(next);
  }, [section, stopCamera]);

  const wordEngineLoading = wordStatus === 'loading';
  useEffect(() => {
    if (!isActive || section !== 'words' || wordEngineLoading) return;
    const id = setInterval(() => setWordStatus(wordState()), 200);
    return () => clearInterval(id);
  }, [isActive, section, wordEngineLoading]);

  const handleRecordSample = useCallback(async (label: string) => {
    const features = agentLastResult?.features;
    if (!features || features.length === 0) {
      showInfo(t('trainNoHand'));
      return;
    }
    await recordSample(label, features);
    await refreshCounts();
  }, [t, refreshCounts, agentLastResult]);

  // En minusculas, como las glosas del modelo: asi "Triste" y "triste" son la misma palabra.
  const handleRecordGesture = useCallback(() => {
    const label = gestureWord.trim().toLowerCase();
    if (!label) {
      showInfo(t('trainGestureNeedLabel'), t('trainGestureTitle'));
      return;
    }
    if (!isActive || wordEngineLoading) {
      showInfo(t('tapStartCamera'), t('trainGestureTitle'));
      return;
    }
    // Se descarta lo que el motor llevara a medias: la toma es la proxima sena.
    gestureEngine.reset?.();
    armedLabelRef.current = label;
    setRecordingGesture(true);
    armTimerRef.current = setTimeout(() => {
      if (!armedLabelRef.current) return;
      disarmTake();
      showError(t('trainGestureNoMotion'));
    }, TAKE_TIMEOUT_MS);
  }, [gestureWord, isActive, wordEngineLoading, t, disarmTake]);

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
    try {
      await wordTakeStore.removeLabel(label);
      if (serverCounts[label]) await deleteWordTemplates(label);
    } catch {
      showError(t('genericError'));
      return;
    }
    await refreshCounts();
  }, [t, refreshCounts, serverCounts]);

  // Las tomas suben al servidor y desde ahi las usa la traduccion en todos
  // los dispositivos, incluido el APK.
  const handleUploadTemplates = useCallback(async () => {
    setSyncing(true);
    try {
      const n = await uploadWordTakes();
      showInfo(n === 0 ? t('syncEmpty') : t('syncUploaded').replace('{n}', String(n)));
      await refreshCounts();
    } catch {
      showError(t('syncFailed'));
    } finally {
      setSyncing(false);
    }
  }, [t, refreshCounts]);

  const handleDownloadTemplates = useCallback(async () => {
    setSyncing(true);
    try {
      const labels = await loadWordTemplates();
      await refreshCounts();
      showInfo(labels.length === 0 ? t('syncEmpty') : t('syncDownloaded').replace('{n}', String(labels.length)));
    } catch {
      showError(t('syncFailed'));
    } finally {
      setSyncing(false);
    }
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
  const isWords = section === 'words';

  const totalSamples = Object.values(sampleCounts).reduce((a, b) => a + b, 0);
  const lettersTrained = ALPHABET_LSC.filter(letter => (sampleCounts[letter] ?? 0) > 0).length;
  const alphabetPercent = Math.round((lettersTrained / ALPHABET_LSC.length) * 100);

  const wordLabels = [...new Set([...Object.keys(serverCounts), ...Object.keys(pendingCounts)])].sort();
  const wordEntries: [string, number][] = wordLabels.map(label => [
    label,
    (serverCounts[label] ?? 0) + (pendingCounts[label] ?? 0),
  ]);
  const totalTakes = wordEntries.reduce((sum, [, count]) => sum + count, 0);
  const wordsComplete = wordEntries.filter(([, count]) => count >= TAKES_PER_WORD).length;
  // Avanza toma a toma en vez de saltar de 0 a 100 cuando se completa una
  // palabra: cada palabra aporta como mucho TAKES_PER_WORD.
  const wordsPercent = wordEntries.length === 0
    ? 0
    : Math.round(
        (wordEntries.reduce((sum, [, count]) => sum + Math.min(count, TAKES_PER_WORD), 0) /
          (wordEntries.length * TAKES_PER_WORD)) * 100
      );

  const percent = isWords ? wordsPercent : alphabetPercent;
  const progressCaption = isWords
    ? t('trainWordsProgress', { done: wordsComplete, total: wordEntries.length })
    : t('trainAlphabetProgress', { done: lettersTrained, total: ALPHABET_LSC.length });

  const stats = isWords
    ? [
        { value: String(wordEntries.length), label: t('trainWordsCount') },
        { value: String(totalTakes), label: t('trainTotalSamples') },
      ]
    : [
        { value: String(totalSamples), label: t('trainTotalSamples') },
        { value: `${lettersTrained}/${ALPHABET_LSC.length}`, label: t('trainLettersCovered') },
      ];

  const STATUS_LABEL: Record<string, string> = {
    idle: t('tapStartCamera'),
    starting: t('agentStarting'),
    detecting: t('agentDetecting'),
    low_confidence: t('agentLowConfidence'),
    no_hands: t('agentNoHands'),
    error: t('agentError'),
  };

  const WORD_STATUS_LABEL: Record<WordEngineStatus, string> = {
    loading: t('trainWordLoading'),
    quieto: recordingGesture ? t('trainWordWaiting') : t('trainWordReady'),
    senando: t('trainWordSigning'),
    analizando: t('trainWordSigning'),
  };
  const statusLabel = isWords ? WORD_STATUS_LABEL[wordStatus] : STATUS_LABEL[agentStatus];

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader showBack onBack={() => navigation.goBack()} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
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
            <Text style={[styles.title, { color: C.textPrimary }]}>{t('adminTrainingTitle')}</Text>
          </View>

          {/* Las dos secciones viven sobre la camara y comparten el mismo visor. */}
          <View style={[styles.tabs, { backgroundColor: C.inputBg, borderColor: C.border }]}>
            {SECTIONS.map(tab => {
              const active = section === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => changeSection(tab.key)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.tab,
                    active
                      ? { backgroundColor: C.surface, borderColor: C.primary }
                      : { backgroundColor: 'transparent', borderColor: 'transparent' },
                  ]}
                >
                  <Ionicons name={tab.icon} size={16} color={active ? C.primary : C.textSecondary} />
                  <Text style={[styles.tabText, { color: active ? C.primaryDark : C.textSecondary }]}>
                    {t(tab.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.grid, isDesktop && styles.gridWide]}>
            {/* Columna izquierda: camara compartida por las dos secciones */}
            <View style={[styles.col, isDesktop && styles.colLeft]}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
                      {isWords ? t('trainTabWords') : t('trainTabAlphabet')}
                    </Text>
                    <Text style={[styles.cardSub, { color: C.textHint }]}>
                      {isWords ? t('trainGestureHint') : t('trainAlphabetHint')}
                    </Text>
                  </View>
                </View>

                <View style={styles.cameraInner}>
                  {isActive && cameraGranted && (
                    <CameraView ref={cameraRef} style={styles.cameraFill} facing="front" animateShutter={false} />
                  )}
                  {!isActive && (
                    <Ionicons name="person-outline" size={110} color="rgba(255,255,255,0.14)" />
                  )}
                  <View style={styles.dashedFrame} pointerEvents="none" />
                  {isActive && (
                    <View style={styles.capturingBadge}>
                      <View style={styles.recDot} />
                      <Text style={styles.capturingText}>{statusLabel}</Text>
                    </View>
                  )}
                  {!isWords && (
                    <View style={styles.lastBox}>
                      <Text style={styles.lastBoxText}>{agentLastResult?.text || '—'}</Text>
                    </View>
                  )}
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
              </View>
            </View>

            {/* Columna derecha: lo que cambia entre alfabeto y palabras */}
            <View style={[styles.col, isDesktop && styles.colRight]}>
              <View style={[styles.statsRow, !isTablet && styles.statsRowStacked]}>
                {stats.map(stat => (
                  <View key={stat.label} style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <Text style={[styles.statValue, { color: C.textPrimary }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: C.textHint }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('trainLearned')}</Text>
                <View style={styles.meterRow}>
                  <ProgressMeter percent={percent} track={C.inputBg} fill={C.primary} />
                  <Text style={[styles.meterPercent, { color: C.primaryDark }]}>{percent}%</Text>
                </View>
                <Text style={[styles.cardSub, { color: C.textSecondary }]}>{progressCaption}</Text>

                {isWords ? (
                  <View style={styles.sectionBody}>
                    <View style={[styles.gestureRow, !isTablet && styles.gestureRowStacked]}>
                      <TextInput
                        style={[styles.gestureInput, { backgroundColor: C.backgroundGray, borderColor: C.border, color: C.textPrimary }, { outlineStyle: 'none' } as any]}
                        placeholder={t('trainGesturePlaceholder')}
                        placeholderTextColor={C.textHint}
                        value={gestureWord}
                        onChangeText={setGestureWord}
                        onFocus={handleInputFocus}
                        autoCapitalize="none"
                        editable={!recordingGesture}
                      />
                      {/* Solo se bloquea mientras graba: si la camara esta apagada o
                          falta la palabra, el propio handler dice que hace falta en
                          vez de dejar un boton muerto. */}
                      <TouchableOpacity
                        style={[styles.gestureRecordBtn, { backgroundColor: recordingGesture ? '#EF4444' : C.primary, opacity: isActive ? 1 : 0.6 }]}
                        onPress={handleRecordGesture}
                        activeOpacity={0.85}
                        disabled={recordingGesture}
                      >
                        <Ionicons name={recordingGesture ? 'radio-button-on' : 'videocam-outline'} size={16} color="#fff" />
                        <Text style={styles.gestureRecordText}>{recordingGesture ? t('trainGestureRecording') : t('trainGestureRecord')}</Text>
                      </TouchableOpacity>
                    </View>

                    {wordEntries.length === 0 ? (
                      <Text style={[styles.emptyText, { color: C.textSecondary }]}>{t('trainWordsEmpty')}</Text>
                    ) : (
                      <View style={styles.gestureList}>
                        {wordEntries.map(([label, count]) => {
                          const complete = count >= TAKES_PER_WORD;
                          return (
                            <View
                              key={label}
                              style={[styles.gestureChip, { backgroundColor: C.primaryBg, borderColor: complete ? C.primary : C.border }]}
                            >
                              {complete && <Ionicons name="checkmark-circle" size={14} color={C.primary} />}
                              <Text style={[styles.gestureChipText, { color: C.primary }]}>{label}</Text>
                              <Text style={[styles.gestureChipTakes, { color: C.textSecondary }]}>
                                {t('trainWordTakes', { count, target: TAKES_PER_WORD })}
                              </Text>
                              {(pendingCounts[label] ?? 0) > 0 && (
                                <View style={styles.pendingBadge}>
                                  <Ionicons name="cloud-upload-outline" size={13} color={C.textSecondary} />
                                  <Text style={[styles.gestureChipTakes, { color: C.textSecondary }]}>
                                    {t('trainWordPending', { n: pendingCounts[label] })}
                                  </Text>
                                </View>
                              )}
                              <TouchableOpacity onPress={() => handleDeleteGesture(label)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Ionicons name="close-circle" size={16} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.sectionBody}>
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
                )}
              </View>

              {isWords && (
                <View style={styles.syncRow}>
                  <TouchableOpacity
                    style={[styles.syncBtn, { borderColor: C.border, backgroundColor: C.surface, opacity: syncing ? 0.5 : 1 }]}
                    onPress={handleUploadTemplates}
                    activeOpacity={0.85}
                    disabled={syncing}
                  >
                    <Ionicons name="cloud-upload-outline" size={17} color={C.primary} />
                    <Text style={[styles.syncBtnText, { color: C.primary }]}>{t('syncUpload')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.syncBtn, { borderColor: C.border, backgroundColor: C.surface, opacity: syncing ? 0.5 : 1 }]}
                    onPress={handleDownloadTemplates}
                    activeOpacity={0.85}
                    disabled={syncing}
                  >
                    <Ionicons name="cloud-download-outline" size={17} color={C.primary} />
                    <Text style={[styles.syncBtnText, { color: C.primary }]}>{t('syncDownload')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!isWords && (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: '#F3D3D3', backgroundColor: C.surface, opacity: totalSamples === 0 ? 0.5 : 1 }]}
                  onPress={handleClearTraining}
                  activeOpacity={0.85}
                  disabled={totalSamples === 0}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.clearBtnText}>{t('trainClearAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  inner: { width: '100%', maxWidth: 1200, alignSelf: 'center', gap: 20 },

  hero: { gap: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  backLinkText: { fontSize: 14, fontWeight: '700' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },

  tabs: { flexDirection: 'row', gap: 6, padding: 6, borderRadius: 16, borderWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 11, borderWidth: 1.5 },
  tabText: { fontSize: 14, fontWeight: '800' },

  grid: { gap: 20 },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 20 },
  colLeft: { flex: 1.1 },
  colRight: { flex: 0.9 },

  card: { borderRadius: 20, borderWidth: 1, padding: 24 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  sectionBody: { marginTop: 20 },

  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meterTrack: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 999 },
  meterPercent: { fontSize: 14, fontWeight: '800', minWidth: 42, textAlign: 'right' },

  cameraInner: { position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: 4 / 3, backgroundColor: '#2A2140', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  cameraFill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  dashedFrame: { position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderWidth: 2, borderColor: 'rgba(190,158,244,0.55)', borderStyle: 'dashed', borderRadius: 16 },
  capturingBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#EF4444' },
  capturingText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  lastBox: { position: 'absolute', top: 16, right: 16, minWidth: 54, height: 54, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  lastBoxText: { color: '#fff', fontSize: 24, fontWeight: '900' },

  actionWrap: { borderRadius: 12, overflow: 'hidden' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  subLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  alphabetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letterBtn: { width: 44, height: 44, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  letterBtnText: { fontSize: 15, fontWeight: '800' },
  letterCountBadge: { position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  letterCountText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 16 },
  statsRowStacked: { flexDirection: 'column' },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 22 },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },

  gestureRow: { flexDirection: 'row', gap: 10 },
  // En pantalla angosta el boton deja al input sin sitio para escribir.
  gestureRowStacked: { flexDirection: 'column' },
  gestureInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15, fontWeight: '700' },
  gestureRecordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 16, borderRadius: 12, height: 48 },
  gestureRecordText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  gestureList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  gestureChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  gestureChipText: { fontSize: 13, fontWeight: '800' },
  gestureChipTakes: { fontSize: 12, fontWeight: '700' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  emptyText: { fontSize: 13, fontWeight: '600', lineHeight: 20, marginTop: 14 },

  syncRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  syncBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, borderWidth: 1.5 },
  syncBtnText: { fontSize: 14, fontWeight: '700' },

  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, borderRadius: 12, borderWidth: 1.5 },
  clearBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
