
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
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

interface LetterItem { letter: string; imageUrl: string }

const ALPHABET: LetterItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map(letter => ({
    letter,
    imageUrl: `https://www.lifeprint.com/asl101/images-handshapes/${letter.toLowerCase()}.gif`,
  }));

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

const HTML_ASSET  = require('../../../assets/model_viewer.html');
const MODEL_ASSET = require('../../../assets/signia_model.glb');

export const AlphabetScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const C = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const PALETTE = isDark ? DARK_ACCENTS : ACCENTS;
  const webViewRef    = useRef<WebView>(null);
  const webViewLoaded = useRef(false);
  const backdropAnim  = useRef(new Animated.Value(0)).current;

  const [selected,   setSelected]   = useState<LetterItem | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [viewerUri,  setViewerUri]  = useState<string | null>(null);
  const [modelUri,   setModelUri]   = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      Asset.loadAsync([MODEL_ASSET]).then(([glb]) => {
        const mUri = glb.localUri ?? glb.uri;
        setModelUri(mUri);
        setViewerUri(`/model_viewer.html?model=${encodeURIComponent(mUri)}`);
      }).catch(err => console.error('[AlphabetScreen] GLB load error:', err));
    } else {
      Asset.loadAsync([HTML_ASSET, MODEL_ASSET]).then(([html, glb]) => {
        setViewerUri(html.localUri ?? html.uri);
        setModelUri(glb.localUri  ?? glb.uri);
      }).catch(err => console.error('[AlphabetScreen] Asset.loadAsync error:', err));
    }
  }, []);

  // En movil 5 columnas dejaban tarjetas de ~58px donde la insignia de la letra
  // tapaba la mano: bajamos a 4 (3 en pantallas muy angostas) y ajustamos
  // separacion y margenes para que la cuadricula respire.
  const isPhone   = width < 600;
  const COLS      = width >= 1024 ? 9 : width >= 768 ? 7 : width >= 600 ? 5 : width >= 380 ? 4 : 3;
  const GAP       = isPhone ? 10 : 14;
  const H_PAD     = isPhone ? 16 : 20;
  const gridMax   = Math.min(width, 1240);
  const ITEM_SIZE = Math.floor((gridMax - H_PAD * 2 - (COLS - 1) * GAP) / COLS);
  // La insignia se escala con la tarjeta para no comersela en pantallas chicas.
  const BADGE     = Math.max(20, Math.round(ITEM_SIZE * 0.28));

  const VIEWER_H = isPhone || height < 600 ? 200 : 240;

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
      setModelReady(false);
    });
  }, [sheetAnim, backdropAnim]);

  const sendPlayAnimation = useCallback((animName: string) => {
    if (Platform.OS === 'web') {
      webViewRef.current?.injectJavaScript(`playAnimation(${JSON.stringify(animName)}); true;`);
    } else {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'PLAY_ANIMATION', animation: animName }));
    }
  }, []);

  const sendLoadModel = useCallback((uri: string) => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'LOAD_MODEL', url: uri }));
  }, []);

  const onWebViewLoad = useCallback(() => {
    webViewLoaded.current = true;
    if (Platform.OS === 'web') {
      setModelReady(true);
    } else if (modelUri) {
      sendLoadModel(modelUri);
    }
  }, [modelUri, sendLoadModel]);

  useEffect(() => {
    if (Platform.OS !== 'web' && modelUri && webViewLoaded.current) {
      sendLoadModel(modelUri);
    }
  }, [modelUri, sendLoadModel]);

  const onWebViewMessage = useCallback((e: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'MODEL_LOADED') setModelReady(true);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (selected && modelReady) {
      sendPlayAnimation(`Letra_${selected.letter}`);
    }
  }, [selected, modelReady, sendPlayAnimation]);

  const replayAnimation = useCallback(() => {
    if (!selected || !modelReady) return;
    sendPlayAnimation(`Letra_${selected.letter}`);
  }, [selected, modelReady, sendPlayAnimation]);

  const navigateLetter = useCallback((direction: 'prev' | 'next') => {
    if (!selected) return;
    const idx = ALPHABET.findIndex(a => a.letter === selected.letter);
    const nextIdx = direction === 'next'
      ? (idx + 1) % ALPHABET.length
      : (idx - 1 + ALPHABET.length) % ALPHABET.length;
    const nextLetter = ALPHABET[nextIdx];
    setSelected(nextLetter);
    if (modelReady) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'PLAY_ANIMATION', animation: `Letra_${nextLetter.letter}` }));
    }
  }, [selected, modelReady]);

  const handleSelect = useCallback((item: LetterItem) => {
    setSelected(item);
    openSheet();
  }, [openSheet]);

  const renderItem: ListRenderItem<LetterItem> = useCallback(({ item, index }) => {
    const ac = PALETTE[index % PALETTE.length];
    return (
      <TouchableOpacity
        style={[
          styles.letterCard,
          { backgroundColor: ac.bg, width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: Math.min(22, ITEM_SIZE * 0.26) },
          // En oscuro la sombra no se percibe: un borde tenue separa la tarjeta del fondo.
          isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.imgWrap, isDark && styles.imgWrapDark]}>
          <Image source={{ uri: item.imageUrl }} style={styles.letterImg} resizeMode="contain" />
        </View>
        <View style={[styles.letterBadge, {
          backgroundColor: ac.fg,
          minWidth: BADGE, height: BADGE,
          left: BADGE * 0.28, bottom: BADGE * 0.28,
          paddingHorizontal: BADGE * 0.26,
        }]}>
          <Text style={[styles.letterBadgeText, { fontSize: Math.round(BADGE * 0.55), color: isDark ? '#1A1327' : '#fff' }]}>{item.letter}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleSelect, ITEM_SIZE, BADGE, PALETTE, isDark]);

  const getItemLayout = useCallback((_: unknown, i: number) => ({
    length: ITEM_SIZE + GAP, offset: (ITEM_SIZE + GAP) * Math.floor(i / COLS), index: i,
  }), [ITEM_SIZE, GAP, COLS]);

  const selIdx    = selected ? ALPHABET.findIndex(a => a.letter === selected.letter) : 0;
  const selAccent = PALETTE[selIdx % PALETTE.length];
  const sheetWidth = Math.min(width - (isPhone ? 24 : 40), 480);
  // El contenido (visor + botones + consejo + navegacion) no cabia en pantallas
  // pequeñas: limitamos la altura y el cuerpo pasa a ser desplazable.
  const sheetMaxH  = height - (isPhone ? 40 : 80);

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />

      <FlatList
        data={ALPHABET}
        key={COLS}
        numColumns={COLS}
        keyExtractor={(item) => item.letter}
        columnWrapperStyle={COLS > 1 ? { gap: GAP, marginBottom: GAP } : undefined}
        contentContainerStyle={[styles.gridContent, { paddingHorizontal: H_PAD }]}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={26}
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
              <Text style={[styles.countText, { color: C.primaryDark }]}>{ALPHABET.length} {t('alphabetLetters')}</Text>
            </View>
          </View>
        }
      />

      {sheetOpen && (
        <Animated.View style={[styles.modalOverlay, isPhone && styles.modalOverlayPhone, { opacity: backdropAnim, pointerEvents: 'box-none' }]}>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.sheet, { width: sheetWidth, maxHeight: sheetMaxH, transform: [{ translateY: sheetAnim }], backgroundColor: C.surface }]}>
            {/* Header */}
            <View style={[styles.sheetHeader, isPhone && styles.sheetHeaderPhone, { borderBottomColor: C.border }]}>
              <View style={[styles.sheetLetterBox, isPhone && styles.sheetLetterBoxPhone, { backgroundColor: selAccent.bg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.sheetLetterBoxText, { color: selAccent.fg }]}>{selected?.letter ?? ''}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: C.textPrimary }]}>{t('alphabetSign')} {selected?.letter ?? ''}</Text>
                <Text style={[styles.sheetSubtitle, { color: C.textHint }]}>{selIdx + 1} de {ALPHABET.length} · LSC</Text>
              </View>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: C.inputBg }]} onPress={closeSheet}>
                <Ionicons name="close" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetBody, isPhone && styles.sheetBodyPhone]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Visor 3D */}
              <View style={[styles.viewerWrap, { height: VIEWER_H, backgroundColor: C.inputBg }]}>
                {viewerUri ? (
                  <WebView
                    ref={webViewRef}
                    source={{ uri: viewerUri }}
                    style={styles.webview}
                    onLoad={onWebViewLoad}
                    onMessage={onWebViewMessage}
                    originWhitelist={['*']}
                    allowFileAccess
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    scrollEnabled={false}
                    bounces={false}
                  />
                ) : null}
                {!modelReady && (
                  <View style={[styles.loadingOverlay, { backgroundColor: C.inputBg }]}>
                    <View style={[styles.loadingPill, { backgroundColor: C.surface, shadowColor: C.primary }]}>
                      <ActivityIndicator size="small" color={C.primary} />
                      <Text style={[styles.loadingText, { color: C.primary }]}>{t('loading')}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Repetir */}
              <View style={styles.playRow}>
                <TouchableOpacity
                  style={[styles.playBtnWrap, { opacity: modelReady ? 1 : 0.5 }]}
                  onPress={replayAnimation}
                  disabled={!modelReady}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={C.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.playBtn}>
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.playBtnText}>{t('alphabetRepeat')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Consejo */}
              <View style={[styles.tipCard, { backgroundColor: C.backgroundGray, borderColor: C.border }]}>
                <View style={[styles.tipIcon, { backgroundColor: C.primaryBg }]}>
                  <Ionicons name="bulb-outline" size={17} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipTitle, { color: C.textPrimary }]}>Consejo</Text>
                  <Text style={[styles.tipText, { color: C.textSecondary }]}>
                    {selected ? t(`alphabetTip${selected.letter}` as TranslationKey) : ''}
                  </Text>
                </View>
              </View>

              {/* Prev / Next */}
              <View style={styles.navRow}>
                <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => navigateLetter('prev')}>
                  <Ionicons name="chevron-back" size={18} color={C.textSecondary} />
                  <Text style={[styles.navText, { color: C.textSecondary }]}>Anterior</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, { borderColor: C.border }]} onPress={() => navigateLetter('next')}>
                  <Text style={[styles.navText, { color: C.textSecondary }]}>Siguiente</Text>
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
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#1E143C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  imgWrap: { width: '72%', height: '72%', alignItems: 'center', justifyContent: 'center' },
  imgWrapDark: { backgroundColor: '#F3F0FB', borderRadius: 12 },
  letterImg: { width: '86%', height: '86%' },
  letterBadge: {
    position: 'absolute', borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  letterBadgeText: { fontWeight: '800' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,20,50,0.55)', zIndex: 10, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  sheetSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  sheetScroll: { flexGrow: 0, flexShrink: 1 },
  sheetBody: { padding: 22, gap: 16 },
  sheetBodyPhone: { padding: 15, gap: 13 },
  viewerWrap: { borderRadius: 16, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  loadingPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 30, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  loadingText: { fontSize: 12, fontWeight: '600' },

  playRow: { flexDirection: 'row', gap: 12 },
  playBtnWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  playBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 48 },
  playBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  tipCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderRadius: 14, padding: 15 },
  tipIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  tipText: { fontSize: 14, lineHeight: 21 },

  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, borderWidth: 1.5 },
  navText: { fontSize: 14, fontWeight: '700' },
});
