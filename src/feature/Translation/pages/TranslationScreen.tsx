
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useSignAgent } from '../../../feature/Translation/hooks/useSignAgent';
import { useGestureAgent } from '../hooks/useGestureAgent';
import { GESTURE_CATEGORIES, GESTURE_DICTIONARY } from '../services/vision';
import { translationsService } from '../services/translations.service';
import { downloadMotionTemplates } from '../services/signTemplates.service';
import { copyToClipboard } from '../../../shared/utils/clipboard';
import { showSuccess, showError } from '../../../shared/utils/dialogs';
import type { SignAgentStatus } from '../../../shared/types';

const SPEECH_LANG: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  pt: 'pt-BR',
};

/**
 * Motor de reconocimiento de la camara:
 * - `palabras`: GestureRecognizer de MediaPipe (sena -> palabra completa, solo web)
 * - `abecedario`: clasificador LSC letra por letra ya existente
 */
type Engine = 'palabras' | 'abecedario';

export const TranslationScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const cameraHeight = isDesktop ? 340 : Math.min(width * 0.62, height * 0.5);
  const C = useColors();
  const { t, language } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const {
    status: agentStatus,
    lastResult: agentLastResult,
    transcript: agentTranscript,
    pendingLetter: agentPendingLetter,
    pendingCount: agentPendingCount,
    confirmFrames: agentConfirmFrames,
    start: agentStart,
    stop: agentStop,
    reset: agentReset,
    backspace: agentBackspace,
    appendSpace: agentAppendSpace,
  } = useSignAgent(cameraRef, { intervalMs: 1500, minConfidence: 0.7, confirmFrames: 2 });

  // Agente de palabras: lee el <video> directo, estabiliza y guarda cada sena.
  const gesture = useGestureAgent();
  const { start: gestureStart, stop: gestureStop, reset: gestureReset } = gesture;

  const TIPS = [
    { icon: 'hand-left-outline' as const, text: t('tip1') },
    { icon: 'sunny-outline' as const, text: t('tip2') },
    { icon: 'reload-outline' as const, text: t('tip3') },
  ];

  const [isActive, setIsActive] = useState(false);
  const [engine, setEngine] = useState<Engine>('palabras');
  const usingGestures = engine === 'palabras';

  const persistSignTranscript = useCallback(async () => {
    const transcript = agentTranscript.trim();
    if (!transcript) return;
    try {
      await translationsService.save({
        inputText: transcript,
        outputText: transcript,
        type: 'sena_texto',
        confidence: agentLastResult?.confidence,
        source: agentLastResult?.source ?? 'mediapipe',
      });
    } catch {
    }
  }, [agentTranscript, agentLastResult]);

  const handleAction = useCallback(async () => {
    if (!isActive) {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          if (Platform.OS === 'web') {
            alert(t('cameraPermissionMsg'));
          } else {
            Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMsg'));
          }
          return;
        }
      }
      setIsActive(true);
      if (usingGestures) {
        // Cada sena confirmada se guarda sola; aqui solo se limpia el panel.
        gestureReset();
        gestureStart();
      } else {
        agentReset();
        agentStart();
      }
    } else {
      setIsActive(false);
      if (usingGestures) {
        gestureStop();
      } else {
        agentStop();
        await persistSignTranscript();
      }
    }
  }, [isActive, usingGestures, permission, requestPermission, t, agentStart, agentStop, agentReset, persistSignTranscript, gestureStart, gestureStop, gestureReset]);

  const switchEngine = useCallback((e: Engine) => {
    setEngine(e);
    setIsActive(false);
    agentStop();
    agentReset();
    gestureStop();
    gestureReset();
  }, [agentStop, agentReset, gestureStop, gestureReset]);

  const handleCopy = useCallback(async (textToCopy: string) => {
    const copied = await copyToClipboard(textToCopy);
    if (copied) {
      showSuccess(t('copiedToClipboard'), t('copied'));
    } else {
      showError(t('copyFailed'));
    }
  }, [t]);

  const speak = useCallback((textToSpeak: string) => {
    const value = textToSpeak.trim();
    if (!value) return;
    Speech.stop();
    Speech.speak(value, { language: SPEECH_LANG[language] ?? 'es-ES' });
  }, [language]);

  useEffect(() => () => { agentStop(); Speech.stop(); }, [agentStop]);

  // Las plantillas de palabras viven en el servidor: se bajan al abrir la
  // pantalla. Si falla (sin red o sin backend), se sigue con las locales.
  useEffect(() => {
    void downloadMotionTemplates('replace').catch(() => undefined);
  }, []);

  const statusLabelKey: Record<SignAgentStatus, string> = {
    idle: 'tapStartCamera',
    starting: 'agentStarting',
    detecting: 'agentDetecting',
    low_confidence: 'agentLowConfidence',
    no_hands: 'agentNoHands',
    error: 'agentError',
  };

  const gestureStatusLabel = (): string => {
    if (!isActive) return t('tapStartCamera');
    if (gesture.status === 'loading') return t('gestureLoadingModel');
    if (gesture.status === 'error') return t('gestureModelError');
    if (gesture.status === 'holding') return t('gestureHolding');
    return t('gestureSearching');
  };

  const cameraStatusLabel = usingGestures
    ? gestureStatusLabel()
    : isActive
      ? t(statusLabelKey[agentStatus] as Parameters<typeof t>[0])
      : t('tapStartCamera');

  // En modo palabras el "resultado" es la lista de senas confirmadas.
  const gestureTranscript = gesture.confirmed.map(c => c.word).join(' ');
  const signResult = usingGestures ? gestureTranscript : agentTranscript;
  const confidencePct = usingGestures
    ? Math.round(gesture.liveScore * 100)
    : agentLastResult
      ? Math.round(agentLastResult.confidence * 100)
      : 0;
  const cameraGranted = permission?.granted ?? false;

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>

          <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
            {/* Cámara */}
            <View style={styles.gridCol}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.cardHead}>
                  <View style={styles.cardHeadLeft}>
                    <View style={[styles.headIcon, { backgroundColor: C.primaryBg }]}>
                      <Ionicons name="videocam-outline" size={20} color={C.primary} />
                    </View>
                    <Text style={[styles.cardHeadTitle, { color: C.textPrimary }]}>{t('modeCamera')}</Text>
                  </View>
                  {isActive && (
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>{t('live')}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.engineToggle}>
                  {(['palabras', 'abecedario'] as const).map(e => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => switchEngine(e)}
                      activeOpacity={0.8}
                      style={[
                        styles.engineChip,
                        { borderColor: C.border, backgroundColor: C.surface },
                        engine === e && { backgroundColor: C.primaryBg, borderColor: C.primary },
                      ]}
                    >
                      <Ionicons
                        name={e === 'palabras' ? 'chatbox-ellipses-outline' : 'text-outline'}
                        size={14}
                        color={engine === e ? C.primary : C.textSecondary}
                      />
                      <Text style={[styles.engineChipText, { color: engine === e ? C.primary : C.textSecondary }]}>
                        {t(e === 'palabras' ? 'engineWords' : 'engineAlphabet')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {usingGestures && !gesture.isSupported && (
                  <View style={[styles.banner, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Ionicons name="warning-outline" size={16} color="#B45309" />
                    <Text style={[styles.bannerText, { color: '#B45309' }]}>{t('gestureUnsupported')}</Text>
                  </View>
                )}

                {usingGestures && gesture.error && (
                  <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                    <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
                    <Text style={[styles.bannerText, { color: '#B91C1C' }]}>{t('gestureModelError')}</Text>
                  </View>
                )}

                {usingGestures && gesture.saveError && (
                  <View style={[styles.banner, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                    <Ionicons name="cloud-offline-outline" size={16} color="#B91C1C" />
                    <Text style={[styles.bannerText, { color: '#B91C1C' }]}>{gesture.saveError}</Text>
                  </View>
                )}

                <View style={[styles.cameraInner, { height: cameraHeight, backgroundColor: C.backgroundGray, borderColor: C.border }]}>
                  {isActive && cameraGranted && (
                    <CameraView ref={cameraRef} style={styles.cameraFill} facing="front" animateShutter={false} />
                  )}

                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {usingGestures && isActive && !!gesture.liveWord && (
                    <View style={styles.gestureOverlay} pointerEvents="none">
                      <Text style={styles.gestureWord}>{gesture.liveWord}</Text>
                      <Text style={styles.gestureScore}>{confidencePct}%</Text>
                      <View style={styles.gestureProgressTrack}>
                        <View style={[styles.gestureProgressFill, { width: `${Math.round(gesture.holdProgress * 100)}%` }]} />
                      </View>
                    </View>
                  )}

                  {!usingGestures && isActive && agentPendingLetter && (
                    <View style={styles.pendingBubble}>
                      <Text style={styles.pendingLetterText}>{agentPendingLetter}</Text>
                      <View style={styles.pendingProgressTrack}>
                        <View style={[styles.pendingProgressFill, { width: `${Math.min(100, (agentPendingCount / agentConfirmFrames) * 100)}%` }]} />
                      </View>
                    </View>
                  )}

                  {!isActive && (
                    <View style={styles.cameraCenter} pointerEvents="none">
                      <View style={[styles.cameraCenterIcon, { backgroundColor: C.primaryBg }]}>
                        <Ionicons name="camera-outline" size={38} color={C.primary} />
                      </View>
                      <Text style={[styles.cameraCenterTitle, { color: C.textPrimary }]}>{t('tapStartCamera')}</Text>
                    </View>
                  )}

                  {isActive && (
                    <View style={styles.cameraStatusBar}>
                      <Ionicons name="ellipse" size={9} color="#10B981" />
                      <Text style={styles.cameraStatusText}>{cameraStatusLabel}</Text>
                      {confidencePct > 0 && (
                        <Text style={styles.cameraStatusPct}>· {confidencePct}%</Text>
                      )}
                    </View>
                  )}
                </View>

                {usingGestures ? (
                  <View style={styles.vocabBlock}>
                    <Text style={[styles.vocabTitle, { color: C.textSecondary }]}>{t('gestureVocabulary')}</Text>
                    <View style={styles.vocabRow}>
                      {GESTURE_CATEGORIES.map(category => (
                        <View key={category} style={[styles.vocabChip, { backgroundColor: C.primaryBg }]}>
                          <Text style={[styles.vocabWord, { color: C.primary }]}>{GESTURE_DICTIONARY[category].word}</Text>
                          <Text style={[styles.vocabHint, { color: C.textHint }]}>{GESTURE_DICTIONARY[category].hint}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.tipsRow}>
                    {TIPS.map((tip, i) => (
                      <View key={i} style={[styles.tipChip, { backgroundColor: C.primaryBg }]}>
                        <Ionicons name={tip.icon} size={13} color={C.primary} />
                        <Text style={[styles.tipText, { color: C.primary }]}>{tip.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Resultado */}
            <View style={styles.gridCol}>
              <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={styles.cardHead}>
                  <View style={styles.cardHeadLeft}>
                    <View style={[styles.headIcon, { backgroundColor: C.primaryBg }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.primary} />
                    </View>
                    <Text style={[styles.cardHeadTitle, { color: C.textPrimary }]}>{t('sectionTranslation')}</Text>
                  </View>
                  {signResult ? (
                    <View style={styles.doneBadge}>
                      <View style={styles.doneDot} />
                      <Text style={styles.doneText}>{t('done')}</Text>
                    </View>
                  ) : (
                    <View style={[styles.waitingBadge, { backgroundColor: C.inputBg }]}>
                      <Text style={[styles.waitingText, { color: C.textHint }]}>{t('waiting')}</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.resultInner, { backgroundColor: C.backgroundGray, borderColor: C.border }]}>
                  {signResult ? (
                    <>
                      <Text style={[styles.resultText, { color: C.textPrimary }]}>{signResult}</Text>
                      {usingGestures && gesture.confirmed.length > 0 && (
                        <View style={styles.confirmedList}>
                          {gesture.confirmed.map(item => (
                            <View key={item.id} style={[styles.confirmedChip, { backgroundColor: C.inputBg }]}>
                              <Ionicons
                                name={item.saved ? 'cloud-done-outline' : 'cloud-upload-outline'}
                                size={13}
                                color={item.saved ? '#059669' : C.textHint}
                              />
                              <Text style={[styles.confirmedWord, { color: C.textPrimary }]}>{item.word}</Text>
                              <Text style={[styles.confirmedScore, { color: C.textHint }]}>{Math.round(item.score * 100)}%</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.resultEmpty}>
                      <Ionicons name="scan-outline" size={32} color={C.primaryLighter} />
                      <Text style={[styles.resultEmptyText, { color: C.textHint }]}>
                        {usingGestures ? t('resultPlaceholderGestures') : t('resultPlaceholderSigns')}
                      </Text>
                    </View>
                  )}
                </View>

                {!!signResult && (
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={() => speak(signResult)}>
                      <Ionicons name="volume-high-outline" size={19} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={() => handleCopy(signResult)}>
                      <Ionicons name="copy-outline" size={18} color={C.primary} />
                    </TouchableOpacity>
                    {usingGestures && gesture.confirmed.length > 0 && (
                      <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={gestureReset}>
                        <Ionicons name="trash-outline" size={17} color={C.textSecondary} />
                      </TouchableOpacity>
                    )}
                    {!usingGestures && !!agentTranscript && (
                      <>
                        <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={agentBackspace}>
                          <Ionicons name="backspace-outline" size={18} color={C.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={agentAppendSpace}>
                          <Ionicons name="ellipsis-horizontal" size={18} color={C.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconAction, { borderColor: C.border }]} onPress={agentReset}>
                          <Ionicons name="trash-outline" size={17} color={C.textSecondary} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Botón de acción */}
          <TouchableOpacity onPress={handleAction} activeOpacity={0.9} style={styles.actionWrap}>
            <LinearGradient
              colors={isActive ? ['#F87171', '#EF4444'] : C.gradientPrimaryDeep}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <Ionicons name={isActive ? 'stop-circle-outline' : 'play-circle-outline'} size={22} color="#fff" />
              <Text style={styles.actionBtnText}>{isActive ? t('stopCamera') : t('startCamera')}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundGray },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  shell: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: 20 },

  grid: { gap: 20 },
  gridDesktop: { flexDirection: 'row' },
  gridCol: { flex: 1 },

  card: { borderRadius: 20, borderWidth: 1, padding: 22 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardHeadTitle: { fontSize: 17, fontWeight: '800' },

  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(16,185,129,0.14)', paddingVertical: 6, paddingHorizontal: 13, borderRadius: 999,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  onlineText: { fontSize: 13, fontWeight: '700', color: '#10B981' },

  cameraInner: { position: 'relative', borderRadius: 16, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cameraFill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cameraCenter: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  cameraCenterIcon: { width: 78, height: 78, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cameraCenterTitle: { fontSize: 16, fontWeight: '700' },
  cameraStatusBar: {
    position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
  },
  cameraStatusText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cameraStatusPct: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },

  corner: { position: 'absolute', width: 26, height: 26, borderColor: '#8B5CF6' },
  cornerTL: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 },

  pendingBubble: {
    position: 'absolute', top: 14, right: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, minWidth: 64,
  },
  pendingLetterText: { color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 30 },
  pendingProgressTrack: { width: 44, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 6, overflow: 'hidden' },
  pendingProgressFill: { height: '100%', borderRadius: 2, backgroundColor: '#fff' },

  engineToggle: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  engineChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5 },
  engineChipText: { fontSize: 13, fontWeight: '700' },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  bannerText: { flex: 1, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },

  gestureOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  gestureWord: { color: '#fff', fontSize: 52, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  gestureScore: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  gestureProgressTrack: { width: 140, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: 6 },
  gestureProgressFill: { height: '100%', borderRadius: 3, backgroundColor: '#fff' },

  vocabBlock: { gap: 10, marginTop: 16 },
  vocabTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  vocabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vocabChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 2 },
  vocabWord: { fontSize: 13, fontWeight: '800' },
  vocabHint: { fontSize: 10.5, fontWeight: '500' },

  confirmedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  confirmedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  confirmedWord: { fontSize: 13, fontWeight: '700' },
  confirmedScore: { fontSize: 11, fontWeight: '600' },

  tipsRow: { gap: 10, marginTop: 16 },
  tipChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  tipText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 19 },

  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.14)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  doneDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  doneText: { fontSize: 12, color: '#10B981', fontWeight: '800' },
  waitingBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  waitingText: { fontSize: 12, fontWeight: '700' },

  resultInner: { borderRadius: 16, borderWidth: 1, padding: 22, minHeight: 180, justifyContent: 'center' },
  resultText: { fontSize: 26, fontWeight: '700', lineHeight: 36 },
  resultEmpty: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  resultEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 260 },
  resultActions: { flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  iconAction: { width: 44, height: 44, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  actionWrap: {
    borderRadius: 16, overflow: 'hidden', alignSelf: 'stretch',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.38, shadowRadius: 20, elevation: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 16 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
