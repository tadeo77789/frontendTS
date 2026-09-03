
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { useAuth } from '../../../app/providers/AuthContext';
import {
  getSampleCounts,
  signVisionProvider,
  exportTrainingJson,
  importTrainingJson,
} from '../../../feature/Translation/services/vision';
import { useLanguage } from '../../../app/providers/LanguageContext';
import { downloadTextFile, pickTextFile, isFileIOSupported } from '../../../shared/utils/fileIO';
import { showSuccess, showError, showInfo, showChoice } from '../../../shared/utils/dialogs';
import type { AdminStackParams } from '../../../app/routes/AdminStackNavigator';

const ALPHABET_LSC = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z', '5',
];

type Nav = NativeStackNavigationProp<AdminStackParams, 'Dashboard'>;

export const AdminDashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const C = useColors();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigation = useNavigation<Nav>();

  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setSampleCounts(await getSampleCounts());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', refresh);
    return unsub;
  }, [navigation, refresh]);

  const totalSamples = Object.values(sampleCounts).reduce((a, b) => a + b, 0);
  const lettersTrained = ALPHABET_LSC.filter(l => (sampleCounts[l] ?? 0) > 0).length;
  const coverage = Math.round((lettersTrained / ALPHABET_LSC.length) * 100);
  const aiActive = totalSamples > 0;

  const handleExport = useCallback(async () => {
    if (!isFileIOSupported()) {
      showInfo(t('adminFileIONotSupported'));
      return;
    }
    try {
      const json = await exportTrainingJson();
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      downloadTextFile(`traduce_senas_dataset_${ts}.json`, json);
      showSuccess(t('adminExportSuccess'));
    } catch {
      showError(t('adminImportError'));
    }
  }, [t]);

  const performImport = useCallback(async (mode: 'merge' | 'replace') => {
    try {
      const content = await pickTextFile();
      if (!content) {
        showInfo(t('adminImportEmpty'));
        return;
      }
      const count = await importTrainingJson(content, mode);
      await refresh();
      showSuccess(t('adminImportSuccess').replace('{count}', String(count)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('adminImportError');
      showError(msg, t('adminImportError'));
    }
  }, [refresh, t]);

  const handleImport = useCallback(async () => {
    if (!isFileIOSupported()) {
      showInfo(t('adminFileIONotSupported'));
      return;
    }
    if (totalSamples === 0) {

      performImport('merge');
      return;
    }
    const choice = await showChoice({
      title: t('adminImportDataset'),
      message: t('adminImportConfirmMerge'),
      icon: 'question',
      cancelText: t('cancel'),
      choices: [
        { key: 'merge', label: t('adminImportMergeOption') },
        { key: 'replace', label: t('adminImportReplaceOption'), destructive: true },
      ],
    });
    if (choice === 'merge' || choice === 'replace') {
      performImport(choice);
    }
  }, [totalSamples, performImport, t]);

  const maxCount = Math.max(1, ...Object.values(sampleCounts));

  const appVersion = '1.0.0';
  const platformLabel = Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iOS' : 'Android';

  const AI_KPIS = [
    { icon: 'server-outline' as const, label: t('trainTotalSamples'), value: String(totalSamples) },
    { icon: 'text-outline' as const,   label: t('trainLettersCovered'), value: `${lettersTrained} / ${ALPHABET_LSC.length}` },
    { icon: 'speedometer-outline' as const, label: t('adminCoverage'), value: `${coverage}%` },
  ];

  const SYSTEM_ROWS = [
    { icon: 'pricetag-outline' as const, label: t('adminAppVersion'), value: appVersion },
    { icon: 'desktop-outline' as const,  label: t('adminPlatform'), value: platformLabel },
    { icon: 'language-outline' as const, label: t('adminLanguage'), value: language.toUpperCase() },
    { icon: 'eye-outline' as const,      label: t('adminVisionProvider'), value: signVisionProvider.name },
    { icon: 'mail-outline' as const,     label: t('adminAdminUser'), value: user?.email ?? '—' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroLeft}>
              <View style={[styles.heroBadge, { backgroundColor: C.primaryBg }]}>
                <Ionicons name="shield-outline" size={14} color={C.primary} />
                <Text style={[styles.heroBadgeText, { color: C.primaryDark }]}>Solo administradores</Text>
              </View>
              <Text style={[styles.title, { color: C.textPrimary }]}>{t('adminDashboardTitle')}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: aiActive ? '#DCF5EA' : C.inputBg }]}>
              <View style={[styles.statusDot, { backgroundColor: aiActive ? '#10B981' : C.textHint }]} />
              <Text style={[styles.statusText, { color: aiActive ? '#10B981' : C.textSecondary }]}>
                {aiActive ? t('adminAiActive') : t('adminAiInactive')}
              </Text>
            </View>
          </View>

          {/* KPIs IA */}
          <View style={[styles.kpiRow, isTablet && styles.kpiRowWide]}>
            {AI_KPIS.map((k, i) => (
              <View key={i} style={[styles.kpiCard, { backgroundColor: C.surface, borderColor: C.border }, isTablet && { flex: 1 }]}>
                <View style={styles.kpiHead}>
                  <View style={[styles.kpiIconBox, { backgroundColor: C.primaryBg }]}>
                    <Ionicons name={k.icon} size={22} color={C.primary} />
                  </View>
                  <Text style={[styles.kpiLabel, { color: C.textHint }]}>{k.label}</Text>
                </View>
                <Text style={[styles.kpiValue, { color: C.textPrimary }]}>{k.value}</Text>
              </View>
            ))}
          </View>

          {/* Muestras por símbolo */}
          <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.cardHead}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: C.textPrimary }]}>{t('adminSamplesPerLetter')}</Text>
                <Text style={[styles.cardSub, { color: C.textHint }]}>Alfabeto LSC · {ALPHABET_LSC.length} símbolos</Text>
              </View>
              <View style={[styles.coveragePill, { backgroundColor: C.primaryBg }]}>
                <Text style={[styles.coverageText, { color: C.primaryDark }]}>{t('adminCoverage')} {coverage}%</Text>
              </View>
            </View>
            <View style={styles.barsChart}>
              {ALPHABET_LSC.map(letter => {
                const count = sampleCounts[letter] ?? 0;
                const pct = Math.max(6, (count / maxCount) * 100);
                return (
                  <View key={letter} style={styles.barCol}>
                    <View style={[styles.barVert, { height: `${pct}%`, backgroundColor: count > 0 ? C.primary : C.border }]} />
                    <Text style={[styles.barColLabel, { color: C.textHint }]}>{letter}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Sistema + Acciones */}
          <View style={[styles.row2, isTablet && styles.row2Wide]}>
            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, isTablet && { flex: 1 }]}>
              <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('adminSystem')}</Text>
              {SYSTEM_ROWS.map((r, i) => (
                <View key={i} style={[styles.systemRow, { borderBottomColor: C.border }, i === SYSTEM_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.systemLeft}>
                    <Ionicons name={r.icon} size={17} color={C.primary} />
                    <Text style={[styles.systemLabel, { color: C.textSecondary }]}>{r.label}</Text>
                  </View>
                  <Text style={[styles.systemValue, { color: C.textPrimary }]} numberOfLines={1}>{r.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }, isTablet && { flex: 1 }]}>
              <Text style={[styles.cardLabel, { color: C.textHint }]}>{t('adminQuickActions')}</Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Training')} style={styles.primaryActionWrap}>
                  <LinearGradient colors={C.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryAction}>
                    <View style={styles.primaryActionIcon}>
                      <Ionicons name="school-outline" size={19} color="#fff" />
                    </View>
                    <Text style={styles.primaryActionText}>{t('adminGoToTraining')}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 'auto' }} />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ghostAction, { borderColor: C.borderInput, opacity: totalSamples === 0 ? 0.5 : 1 }]}
                  onPress={handleExport}
                  disabled={totalSamples === 0}
                  activeOpacity={0.85}
                >
                  <View style={[styles.ghostActionIcon, { backgroundColor: C.primaryBg }]}>
                    <Ionicons name="download-outline" size={19} color={C.primary} />
                  </View>
                  <Text style={[styles.ghostActionText, { color: C.textPrimary }]}>{t('adminExportDataset')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ghostAction, { borderColor: C.borderInput }]}
                  onPress={handleImport}
                  activeOpacity={0.85}
                >
                  <View style={[styles.ghostActionIcon, { backgroundColor: C.primaryBg }]}>
                    <Ionicons name="cloud-upload-outline" size={19} color={C.primary} />
                  </View>
                  <Text style={[styles.ghostActionText, { color: C.textPrimary }]}>{t('adminImportDataset')}</Text>
                </TouchableOpacity>
              </View>
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

  hero: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  heroLeft: { gap: 12, flex: 1, minWidth: 240 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '800' },

  kpiRow: { gap: 16 },
  kpiRowWide: { flexDirection: 'row' },
  kpiCard: { borderRadius: 18, borderWidth: 1, padding: 24, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 3 },
  kpiHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  kpiIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  kpiValue: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },

  card: { borderRadius: 20, borderWidth: 1, padding: 26 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 22 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 20 },
  coveragePill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  coverageText: { fontSize: 13, fontWeight: '800' },

  barsChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 150 },
  barCol: { flex: 1, alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' },
  barVert: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 8 },
  barColLabel: { fontSize: 10, fontWeight: '800' },

  row2: { gap: 20 },
  row2Wide: { flexDirection: 'row', alignItems: 'flex-start' },
  systemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  systemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  systemLabel: { fontSize: 14, fontWeight: '700' },
  systemValue: { fontSize: 14, fontWeight: '800', flexShrink: 1 },

  primaryActionWrap: { borderRadius: 14, overflow: 'hidden' },
  primaryAction: { flexDirection: 'row', alignItems: 'center', gap: 13, height: 56, paddingHorizontal: 18 },
  primaryActionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ghostAction: { flexDirection: 'row', alignItems: 'center', gap: 13, height: 56, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5 },
  ghostActionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ghostActionText: { fontSize: 15, fontWeight: '700' },
});
