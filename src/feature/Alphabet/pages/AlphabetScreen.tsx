import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ListRenderItem,
  Platform,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useAlphabet } from '../hooks/useAlphabet';
import type { AlphabetLetter } from '../data/alphabet';
import { LetterViewer, type LetterViewerHandle } from '../components/LetterViewer';

const ACCENTS = [
  { bg: '#EFEBFD', fg: '#8B5CF6' },
  { bg: '#E4EEFE', fg: '#3B82F6' },
  { bg: '#DCF5EA', fg: '#10B981' },
  { bg: '#FCF3D6', fg: '#F59E0B' },
  { bg: '#FCE3EC', fg: '#EC4899' },
  { bg: '#FDE4E4', fg: '#EF4444' },
];

const DARK_ACCENTS = [
  { bg: '#372860', fg: '#B18CF5' },
  { bg: '#1D3157', fg: '#7DB6FB' },
  { bg: '#12372A', fg: '#4FDDA9' },
  { bg: '#38260C', fg: '#FBD154' },
  { bg: '#38182E', fg: '#F888BE' },
  { bg: '#380F17', fg: '#FB8F9C' },
];

type ViewerState = 'loading' | 'ready' | 'error';

export const AlphabetScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const C = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { letters } = useAlphabet();
  const PALETTE = isDark ? DARK_ACCENTS : ACCENTS;
  const viewerRef    = useRef<LetterViewerHandle>(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [selected,    setSelected]    = useState<AlphabetLetter | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>('loading');
  const [playing,     setPlaying]     = useState(false);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  // Cambiarla remonta el visor: es el "reintentar" cuando falla la carga.
  const [viewerKey,   setViewerKey]   = useState(0);

  // En movil 5 columnas dejaban tarjetas de ~58px donde no se distinguia la
  // mano: bajamos a 4 (3 en pantallas muy angostas) y ajustamos separacion y
  // margenes para que la cuadricula respire.
  const isPhone   = width < 600;
  const COLS      = width >= 1024 ? 9 : width >= 768 ? 7 : width >= 600 ? 5 : width >= 380 ? 4 : 3;
  const GAP       = isPhone ? 10 : 14;
  const H_PAD     = isPhone ? 16 : 20;
  const gridMax   = Math.min(width, 1240);
  const ITEM_SIZE = Math.floor((gridMax - H_PAD * 2 - (COLS - 1) * GAP) / COLS);
  // La insignia se escala con la tarjeta para no comersela en pantallas chicas.
  const BADGE     = Math.max(20, Math.round(ITEM_SIZE * 0.26));

  // El modelo es un busto: en 4:3 entran cabeza y las dos manos sin recortar.
  const sheetWidth = Math.min(width - (isPhone ? 24 : 40), 480);
  const VIEWER_H   = Math.round(Math.min((sheetWidth - (isPhone ? 30 : 44)) * 0.75, height < 700 ? 230 : 320));

  const sheetAnim = useRef(new Animated.Value(500)).current;

  const openSheet = useCallback(() => {
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [sheetAnim, backdropAnim]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetAnim, { toValue: 500, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setSheetOpen(false);
      setSelected(null);
      setViewerState('loading');
      setPlaying(false);
    });
  }, [sheetAnim, backdropAnim]);

  const replayAnimation = useCallback(() => {
    if (!selected?.animated || viewerState !== 'ready') return;
    setPlaying(true);
    viewerRef.current?.replay();
  }, [selected, viewerState]);

  const resetView = useCallback(() => viewerRef.current?.resetView(), []);

  const navigateLetter = useCallback((direction: 'prev' | 'next') => {
    if (!selected || letters.length === 0) return;
    const idx = letters.findIndex(a => a.code === selected.code);
    const nextIdx = direction === 'next'
      ? (idx + 1) % letters.length
      : (idx - 1 + letters.length) % letters.length;
    setSelected(letters[nextIdx]);
  }, [selected, letters]);

  const handleSelect = useCallback((item: AlphabetLetter) => {
    setSelected(item);
    openSheet();
  }, [openSheet]);

  // Teclado en web: flechas para cambiar de letra, espacio para repetir, Esc cierra.
  useEffect(() => {
    if (Platform.OS !== 'web' || !sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateLetter('next');
      else if (e.key === 'ArrowLeft') navigateLetter('prev');
      else if (e.key === 'Escape') closeSheet();
      else if (e.key === ' ') { e.preventDefault(); replayAnimation(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, navigateLetter, closeSheet, replayAnimation]);

  const renderItem: ListRenderItem<AlphabetLetter> = useCallback(({ item, index }) => {
    const ac = PALETTE[index % PALETTE.length];
    const radius = Math.min(22, ITEM_SIZE * 0.26);
    return (
      <TouchableOpacity
        style={[
          styles.letterCard,
          { backgroundColor: ac.bg, width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: radius },
          // En oscuro la sombra no se percibe: un borde tenue separa la tarjeta del fondo.
          isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('alphabetOpenLetter', { letter: item.letter })}
      >
        {/* La miniatura es el mismo modelo 3D renderizado: el busto ocupa la
            tarjeta y la mano que hace la letra queda arriba a la izquierda. */}
        <Image source={item.thumb} style={styles.letterImg} resizeMode="contain" />

        {/* Arriba a la derecha es la unica esquina que ninguna pose ocupa. */}
        <View style={[styles.letterBadge, {
          backgroundColor: ac.fg,
          minWidth: BADGE, height: BADGE,
          right: BADGE * 0.3, top: BADGE * 0.3,
          paddingHorizontal: BADGE * 0.24,
        }]}>
          <Text style={[styles.letterBadgeText, { fontSize: Math.round(BADGE * 0.56), color: isDark ? '#1A1327' : '#fff' }]}>{item.letter}</Text>
        </View>

        {item.animated && (
          <View
            style={[styles.motionDot, {
              width: BADGE * 0.82, height: BADGE * 0.82,
              left: BADGE * 0.3, bottom: BADGE * 0.3,
              backgroundColor: isDark ? 'rgba(26,19,39,0.78)' : 'rgba(255,255,255,0.9)',
            }]}
            accessibilityLabel={t('alphabetMotion')}
          >
            <Ionicons name="sync" size={Math.round(BADGE * 0.46)} color={ac.fg} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleSelect, ITEM_SIZE, BADGE, PALETTE, isDark, t]);

  const getItemLayout = useCallback((_: unknown, i: number) => ({
    length: ITEM_SIZE + GAP, offset: (ITEM_SIZE + GAP) * Math.floor(i / COLS), index: i,
  }), [ITEM_SIZE, GAP, COLS]);

  const selIdx    = selected ? Math.max(0, letters.findIndex(a => a.code === selected.code)) : 0;
  const selAccent = PALETTE[selIdx % PALETTE.length];
  // El contenido (visor + botones + consejo + navegacion) no cabia en pantallas
  // pequeñas: limitamos la altura y el cuerpo pasa a ser desplazable.
  const sheetMaxH  = height - (isPhone ? 40 : 80);
  const canReplay  = !!selected?.animated && viewerState === 'ready';

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />

      <FlatList
        data={letters}
        key={COLS}
        numColumns={COLS}
        keyExtractor={(item) => item.code}
        columnWrapperStyle={COLS > 1 ? { gap: GAP, marginBottom: GAP } : undefined}
        contentContainerStyle={[styles.gridContent, { paddingHorizontal: H_PAD }]}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={27}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.hero, isPhone && styles.heroPhone]}>
            <View style={[styles.heroLeft, isPhone && styles.heroLeftPhone]}>
              <View style={[styles.heroBadge, { backgroundColor: C.primaryBg }]}>
                <Ionicons name="hand-left-outline" size={14} color={C.primary} />
                <Text style={[styles.heroBadgeText, isPhone && styles.heroBadgeTextPhone, { color: C.primaryDark }]}>{t('appTagline')}</Text>
              </View>
              <Text style={[styles.title, isPhone && styles.titlePhone, { color: C.textPrimary }]}>
                {(() => {
                  const full = t('alphabetTitle');
                  const idx = full.indexOf('LSC');
                  if (idx === -1) return full;
                  return (
                    <>
                      {full.slice(0, idx)}
                      <Text style={{ color: C.primary }}>LSC</Text>
                      {full.slice(idx + 3)}
                    </>
                  );
                })()}
              </Text>
              <Text style={[styles.subtitle, isPhone && styles.subtitlePhone, { color: C.textSecondary }]}>{t('alphabetTip')}</Text>
            </View>
            <View style={[styles.countPill, isPhone && styles.countPillPhone, { backgroundColor: C.surface, borderColor: C.borderInput }]}>
              <Ionicons name="grid-outline" size={16} color={C.primaryDark} />
              <Text style={[styles.countText, { color: C.primaryDark }]}>{letters.length} {t('alphabetLetters')}</Text>
            </View>
          </View>
        }
      />

      {sheetOpen && selected && (
        <Animated.View style={[styles.modalOverlay, isPhone && styles.modalOverlayPhone, { opacity: backdropAnim, pointerEvents: 'box-none' }]}>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[styles.sheet, { width: sheetWidth, maxHeight: sheetMaxH, transform: [{ translateY: sheetAnim }], backgroundColor: C.surface }]}
            accessibilityViewIsModal
          >
            {/* Header */}
            <View style={[styles.sheetHeader, isPhone && styles.sheetHeaderPhone, { borderBottomColor: C.border }]}>
              <View style={[styles.sheetLetterBox, isPhone && styles.sheetLetterBoxPhone, { backgroundColor: selAccent.bg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.sheetLetterBoxText, { color: selAccent.fg }]}>{selected.letter}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: C.textPrimary }]}>{t('alphabetSign')} {selected.letter}</Text>
                <View style={styles.sheetMeta}>
                  <Text style={[styles.sheetSubtitle, { color: C.textHint }]}>
                    {t('alphabetOf', { n: selIdx + 1, total: letters.length })} · LSC
                  </Text>
                  <View style={[styles.kindChip, { backgroundColor: selected.animated ? selAccent.bg : C.inputBg }]}>
                    <Ionicons
                      name={selected.animated ? 'sync' : 'hand-left-outline'}
                      size={11}
                      color={selected.animated ? selAccent.fg : C.textSecondary}
                    />
                    <Text style={[styles.kindChipText, { color: selected.animated ? selAccent.fg : C.textSecondary }]}>
                      {selected.animated ? t('alphabetMotion') : t('alphabetStatic')}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: C.inputBg }]}
                onPress={closeSheet}
                accessibilityRole="button"
                accessibilityLabel={t('alphabetClose')}
              >
                <Ionicons name="close" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetBody, isPhone && styles.sheetBodyPhone]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Visor 3D: un solo visor para todas las letras; al navegar
                  solo se le manda el modelo nuevo. */}
              <View style={[styles.viewerWrap, { height: VIEWER_H, backgroundColor: selAccent.bg }]}>
                <LetterViewer
                  key={viewerKey}
                  ref={viewerRef}
                  model={selected.model}
                  letter={selected.letter}
                  animated={selected.animated}
                  dark={isDark}
                  onLoadStart={() => { setViewerState('loading'); setPlaying(false); }}
                  onLoaded={({ animated }) => { setViewerState('ready'); setPlaying(animated); }}
                  onAnimationEnd={() => setPlaying(false)}
                  onError={() => setViewerState('error')}
                />

                {viewerState === 'ready' && (
                  <View style={[styles.dragHint, { backgroundColor: isDark ? 'rgba(26,19,39,0.7)' : 'rgba(255,255,255,0.8)' }]} pointerEvents="none">
                    <Ionicons name="move-outline" size={12} color={C.textSecondary} />
                    <Text style={[styles.dragHintText, { color: C.textSecondary }]}>{t('alphabetDragHint')}</Text>
                  </View>
                )}

                {viewerState === 'loading' && (
                  <View style={styles.loadingOverlay} pointerEvents="none">
                    {/* Mientras baja el modelo se muestra la miniatura: la
                        pose aparece al instante y el 3D la reemplaza. */}
                    <Image source={selected.thumb} style={styles.loadingThumb} resizeMode="contain" />
                    <View style={[styles.loadingPill, { backgroundColor: C.surface, shadowColor: C.primary }]}>
                      <ActivityIndicator size="small" color={C.primary} />
                      <Text style={[styles.loadingText, { color: C.primary }]}>{t('loading')}</Text>
                    </View>
                  </View>
                )}

                {viewerState === 'error' && (
                  <View style={[styles.loadingOverlay, { backgroundColor: selAccent.bg }]}>
                    <Image source={selected.thumb} style={styles.loadingThumb} resizeMode="contain" />
                    <View style={[styles.errorCard, { backgroundColor: C.surface }]}>
                      <Text style={[styles.errorText, { color: C.textSecondary }]}>{t('alphabetModelError')}</Text>
                      <TouchableOpacity onPress={() => setViewerKey(k => k + 1)} style={[styles.retryBtn, { borderColor: C.primary }]}>
                        <Ionicons name="refresh" size={14} color={C.primary} />
                        <Text style={[styles.retryText, { color: C.primary }]}>{t('alphabetRetry')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Repetir (solo letras con movimiento) + centrar vista */}
              <View style={styles.playRow}>
                {selected.animated && (
                  <TouchableOpacity
                    style={[styles.playBtnWrap, { opacity: canReplay ? 1 : 0.5 }]}
                    onPress={replayAnimation}
                    disabled={!canReplay}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                  >
                    <LinearGradient colors={C.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playBtn}>
                      <Ionicons name={playing ? 'pulse' : 'play'} size={18} color="#fff" />
                      <Text style={styles.playBtnText}>{t('alphabetRepeat')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.resetBtn,
                    { borderColor: C.border, opacity: viewerState === 'ready' ? 1 : 0.5 },
                    !selected.animated && { flex: 1 },
                  ]}
                  onPress={resetView}
                  disabled={viewerState !== 'ready'}
                  accessibilityRole="button"
                  accessibilityLabel={t('alphabetResetView')}
                >
                  <Ionicons name="scan-outline" size={18} color={C.textSecondary} />
                  {(!selected.animated || !isPhone) && (
                    <Text style={[styles.navText, { color: C.textSecondary }]}>{t('alphabetResetView')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Cómo se hace: descripción del léxico */}
              <View style={[styles.tipCard, { backgroundColor: C.backgroundGray, borderColor: C.border }]}>
                <View style={[styles.tipIcon, { backgroundColor: C.primaryBg }]}>
                  <Ionicons name="bulb-outline" size={17} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipTitle, { color: C.textPrimary }]}>{t('alphabetHowTo')}</Text>
                  <Text style={[styles.tipText, { color: C.textSecondary }]}>{selected.description}</Text>
                </View>
              </View>

              {/* Prev / Next */}
              <View style={styles.navRow}>
                <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => navigateLetter('prev')} accessibilityRole="button">
                  <Ionicons name="chevron-back" size={18} color={C.textSecondary} />
                  <Text style={[styles.navText, { color: C.textSecondary }]}>{t('alphabetPrev')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => navigateLetter('next')} accessibilityRole="button">
                  <Text style={[styles.navText, { color: C.textSecondary }]}>{t('alphabetNext')}</Text>
                  <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundGray ?? '#F8F9FC' },

  gridContent: { paddingBottom: 40, maxWidth: 1240, width: '100%', alignSelf: 'center' },

  hero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', paddingTop: 24, paddingBottom: 24 },
  heroPhone: { flexDirection: 'column', alignItems: 'flex-start', gap: 14, paddingTop: 18, paddingBottom: 18 },
  heroLeft: { gap: 12, flex: 1, minWidth: 260 },
  heroLeftPhone: { gap: 9, minWidth: 0, width: '100%' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  heroBadgeTextPhone: { fontSize: 12 },
  title: { fontSize: 38, fontWeight: '800', letterSpacing: -0.6 },
  titlePhone: { fontSize: 27, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, lineHeight: 24, maxWidth: 520 },
  subtitlePhone: { fontSize: 14, lineHeight: 20 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1 },
  countPillPhone: { paddingVertical: 7, paddingHorizontal: 14 },
  countText: { fontSize: 14, fontWeight: '800' },

  letterCard: {
    alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden',
    shadowColor: '#1E143C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  letterImg: { width: '100%', height: '100%' },
  letterBadge: {
    position: 'absolute', borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  letterBadgeText: { fontWeight: '800' },
  motionDot: { position: 'absolute', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30,20,50,0.55)', zIndex: 10, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalOverlayPhone: { padding: 12 },
  sheet: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#1E143C', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.35, shadowRadius: 60, elevation: 24,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderBottomWidth: 1 },
  sheetHeaderPhone: { gap: 11, padding: 14 },
  sheetLetterBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetLetterBoxPhone: { width: 44, height: 44, borderRadius: 12 },
  sheetLetterBoxText: { fontSize: 26, fontWeight: '900' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  sheetSubtitle: { fontSize: 13, fontWeight: '700' },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  kindChipText: { fontSize: 11, fontWeight: '800' },
  closeBtn: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  sheetBody: { padding: 22, gap: 16 },
  sheetBodyPhone: { padding: 15, gap: 13 },
  viewerWrap: { borderRadius: 16, overflow: 'hidden' },
  dragHint: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  dragHintText: { fontSize: 11, fontWeight: '600' },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  loadingThumb: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.55 },
  loadingPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 30, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  loadingText: { fontSize: 12, fontWeight: '600' },
  errorCard: { alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginHorizontal: 20, maxWidth: 300 },
  errorText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  retryText: { fontSize: 13, fontWeight: '700' },

  playRow: { flexDirection: 'row', gap: 12 },
  playBtnWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48 },
  playBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, minWidth: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },

  tipCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderRadius: 14, padding: 15 },
  tipIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  tipText: { fontSize: 14, lineHeight: 21 },

  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, borderWidth: 1.5 },
  navText: { fontSize: 14, fontWeight: '700' },
});
