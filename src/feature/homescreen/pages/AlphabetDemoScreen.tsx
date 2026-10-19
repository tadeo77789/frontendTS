import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PublicHeader } from '../../../shared/components/common/PublicHeader';
import { PublicFooter } from '../../../shared/components/common/PublicFooter';
import { LandingTheme as D } from '../../../shared/constants/landingTheme';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PALETTE = [
  { bg: '#EFEBFD', badge: '#8B5CF6', faint: '#C9BAF3' },
  { bg: '#E4EEFE', badge: '#3B82F6', faint: '#AECBF6' },
  { bg: '#DCF5EA', badge: '#10B981', faint: '#A6E5CC' },
  { bg: '#FCF3D6', badge: '#F59E0B', faint: '#EBD08A' },
  { bg: '#FCE3EC', badge: '#EC4899', faint: '#F3B5CE' },
  { bg: '#FDE4E4', badge: '#EF4444', faint: '#F3B0B0' },
];

const APARTADOS: { icon: keyof typeof Ionicons.glyphMap; title: TranslationKey; desc: TranslationKey }[] = [
  { icon: 'text-outline', title: 'pubNavAlphabet', desc: 'pubAlAlphabetDesc' },
  { icon: 'camera-outline', title: 'pubNavTranslator', desc: 'pubFeatTranslatorDesc' },
  { icon: 'bar-chart-outline', title: 'pubFooterStats', desc: 'pubAlStatsDesc' },
  { icon: 'time-outline', title: 'pubFooterHistory', desc: 'pubAlHistoryDesc' },
];

export const AlphabetDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMid = width >= 640;
  const [open, setOpen] = useState(false);

  const cols = isWide ? 9 : isMid ? 6 : 4;
  const cellPct = `${100 / cols - 2}%`;

  return (
    <View style={styles.root}>
      <PublicHeader active="alfabeto" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#FBFAFE', '#F6F3FD']} style={styles.heroBg}>
          <View style={styles.heroInner}>
            <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
              {t('pubAlTitle')}<Text style={{ color: D.purple }}>{t('pubAlTitleAccent')}</Text>{t('pubAlTitleEnd')}
            </Text>
            <Text style={styles.heroSub}>{t('pubAlSubtitle', { n: CHARS.length })}</Text>
            <View style={[styles.heroActions, !isMid && { flexDirection: 'column', alignSelf: 'stretch' }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Register')} style={styles.primaryBtnWrap}>
                <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>{t('pubCreateAccount')}</Text>
                  <Ionicons name="arrow-forward" size={18} color={D.white} />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Login')} style={styles.ghostBtn}>
                <Text style={styles.ghostBtnText}>{t('pubLogin')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Grid de letras */}
        <View style={styles.section}>
          <View style={styles.lettersGrid}>
            {CHARS.map((ch, i) => {
              const p = PALETTE[i % PALETTE.length];
              return (
                <TouchableOpacity
                  key={ch}
                  activeOpacity={0.85}
                  onPress={() => setOpen(true)}
                  style={[styles.letter, { backgroundColor: p.bg, width: cellPct as any }]}
                >
                  <Ionicons name="hand-left" size={40} color={p.faint} />
                  <View style={[styles.letterBadge, { backgroundColor: p.badge }]}>
                    <Text style={styles.letterBadgeText}>{ch}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Apartados */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t('pubAlIncludes')}</Text>
          <Text style={styles.h2Sub}>{t('pubAlIncludesSub')}</Text>
          <View style={[styles.apGrid, isMid && styles.apGridWide]}>
            {APARTADOS.map(a => (
              <View key={a.title} style={[styles.apCard, isMid && { flex: 1, minWidth: '40%' }]}>
                <View style={styles.apIcon}>
                  <Ionicons name={a.icon} size={26} color={D.purple} />
                </View>
                <Text style={styles.apTitle}>{t(a.title)}</Text>
                <Text style={styles.apDesc}>{t(a.desc)}</Text>
              </View>
            ))}
          </View>
        </View>

        <PublicFooter />
      </ScrollView>

      {/* Modal de bloqueo */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
            <View style={styles.modalIcon}>
              <Ionicons name="lock-closed" size={34} color={D.purple} />
            </View>
            <Text style={styles.modalTitle}>{t('pubAlModalTitle')}</Text>
            <Text style={styles.modalText}>{t('pubAlModalText')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalGhost} onPress={() => { setOpen(false); navigation.navigate('Login'); }}>
                <Text style={styles.modalGhostText}>{t('pubLogin')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryWrap} onPress={() => { setOpen(false); navigation.navigate('Register'); }}>
                <LinearGradient colors={[D.purpleBtn, D.purpleBtn2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalPrimary}>
                  <Text style={styles.modalPrimaryText}>{t('pubCreateAccount')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>{t('pubTapOutsideToClose')}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.white },
  heroBg: { width: '100%' },
  heroInner: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 52, alignItems: 'center' },
  heroTitle: { fontSize: 34, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.6, marginBottom: 14 },
  heroTitleWide: { fontSize: 44 },
  heroSub: { fontSize: 17, lineHeight: 27, color: D.body, textAlign: 'center', maxWidth: 560, marginBottom: 28 },
  heroActions: { flexDirection: 'row', gap: 14 },
  primaryBtnWrap: { borderRadius: 12, overflow: 'hidden' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 52, paddingHorizontal: 26 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: D.white },
  ghostBtn: { alignItems: 'center', justifyContent: 'center', height: 52, paddingHorizontal: 26, borderRadius: 12, borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: D.white },
  ghostBtnText: { fontSize: 15, fontWeight: '700', color: D.purple },

  section: { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  lettersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'flex-start' },
  letter: { aspectRatio: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  letterBadge: {
    position: 'absolute', left: 10, bottom: 10, minWidth: 28, height: 28, paddingHorizontal: 8,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  letterBadgeText: { color: D.white, fontSize: 14, fontWeight: '800' },

  h2: { fontSize: 26, fontWeight: '800', color: D.ink, textAlign: 'center', letterSpacing: -0.4, marginBottom: 8 },
  h2Sub: { fontSize: 15, color: D.hint, textAlign: 'center', fontWeight: '600', marginBottom: 30 },
  apGrid: { gap: 20 },
  apGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  apCard: { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.lilacLine, borderRadius: 18, padding: 26 },
  apIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  apTitle: { fontSize: 18, fontWeight: '800', color: D.ink, marginBottom: 8 },
  apDesc: { fontSize: 14, lineHeight: 22, color: D.body },

  backdrop: { flex: 1, backgroundColor: 'rgba(30,20,50,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modal: {
    width: '100%', maxWidth: 400, backgroundColor: D.white, borderRadius: 26, padding: 32, alignItems: 'center',
    shadowColor: '#1E143C', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.35, shadowRadius: 70, elevation: 20,
  },
  modalIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: D.lilacBg, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: D.ink, marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 15, lineHeight: 22, color: D.body, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  modalGhost: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: D.borderSoft, backgroundColor: D.white },
  modalGhostText: { fontSize: 15, fontWeight: '700', color: D.purple },
  modalPrimaryWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  modalPrimary: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50 },
  modalPrimaryText: { fontSize: 15, fontWeight: '700', color: D.white },
  modalHint: { fontSize: 12, fontWeight: '600', color: D.hintSoft, marginTop: 16 },
});
