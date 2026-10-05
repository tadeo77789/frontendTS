
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  LayoutChangeEvent,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation, type TranslationKey } from '../../../app/config/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { statsService, type AdminStats } from '../services/stats.service';

const BAR_GAP = 4;
const BAR_CHART_HEIGHT = 100;
/** Hueco reservado sobre la barra para el numero. */
const BAR_VALUE_SPACE = 16;

const BarChart: React.FC<{
  data: { label: string; value: number }[];
  colors: [string, string];
  maxValue?: number;
  showAxes?: boolean;
}> = ({ data, colors, maxValue, showAxes }) => {
  const C = useColors();
  // El grafico media las barras con porcentajes ('100%' en la fila, '80%' en
  // cada barra). Dentro del ScrollView del modal ese porcentaje no resuelve y
  // las barras salian con ancho cero: la tarjeta mostraba la tabla pero no el
  // diagrama. Ahora medimos el area util y repartimos el ancho en pixeles.
  const [plotWidth, setPlotWidth] = useState(0);
  const max = maxValue || Math.max(...data.map(d => d.value)) || 1;
  const rowHeight = BAR_CHART_HEIGHT + BAR_VALUE_SPACE;

  const slot = plotWidth > 0 ? (plotWidth - BAR_GAP * (data.length - 1)) / data.length : 0;
  const barWidth = Math.max(6, slot * 0.7);
  // Hasta el primer onLayout no hay medida: repartimos con flex para no
  // dibujar un hueco vacio.
  const slotStyle = slot > 0 ? { width: slot } : { flex: 1 };

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max * (ticks - i)) / ticks));

  return (
    <View style={bar.container}>
      <View style={bar.row}>
        {showAxes && (
          <View style={[bar.axis, { height: rowHeight }]}>
            {tickValues.map((tv, i) => (
              <Text key={i} style={[bar.axisLabel, { color: C.textHint }]}>{tv}</Text>
            ))}
          </View>
        )}

        <View style={bar.plot} onLayout={e => setPlotWidth(e.nativeEvent.layout.width)}>
          <View style={[bar.bars, { height: rowHeight }]}>
            {data.map((item, i) => (
              <View key={i} style={[bar.barGroup, slotStyle]}>
                <Text style={[bar.valueLabel, { color: C.textHint }]} numberOfLines={1}>{item.value}</Text>
                <View style={[bar.barWrap, { width: barWidth, height: Math.max(4, (item.value / max) * BAR_CHART_HEIGHT) }]}>
                  <LinearGradient colors={colors} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={bar.bar} />
                </View>
              </View>
            ))}
          </View>

          {showAxes && <View style={[bar.axisLine, { borderTopColor: C.border }]} />}

          <View style={bar.labels}>
            {data.map((item, i) => (
              <Text key={i} style={[bar.barLabel, { color: C.textHint }, slotStyle]} numberOfLines={1}>{item.label}</Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const LineChart: React.FC<{
  data: number[];
  color: string;
  labels?: string[];
  showAxes?: boolean;
  height?: number;
}> = ({ data, color, labels, showAxes, height }) => {
  const C = useColors();
  // Antes se media el contenedor entero pero la linea se dibujaba dentro de un
  // hijo desplazado 48px por el eje, asi que los ultimos puntos se salian y el
  // recorte se los comia; ademas ese hijo no tenia altura y el eje acababa
  // encima de la grafica. Ahora medimos el area de dibujo, que es la que manda.
  const [plotWidth, setPlotWidth] = useState(0);
  const max = Math.max(...data) || 1;
  const chartHeight = height || 80;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== plotWidth) setPlotWidth(w);
  };

  const points = data.map((v, i) => ({
    x: i * step,
    y: chartHeight - (v / max) * chartHeight,
  }));

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max * (ticks - i)) / ticks));

  return (
    <View style={lineStyle.container}>
      <View style={lineStyle.row}>
        {showAxes && (
          <View style={[lineStyle.axis, { height: chartHeight }]}>
            {tickValues.map((tv, i) => (
              <Text key={i} style={[lineStyle.axisLabel, { color: C.textHint }]}>{tv}</Text>
            ))}
          </View>
        )}

        <View style={lineStyle.plotCol}>
          <View style={[lineStyle.plot, { height: chartHeight }]} onLayout={handleLayout}>
            {plotWidth > 0 && points.slice(0, -1).map((pt, i) => {
              const next = points[i + 1];
              const dx = next.x - pt.x;
              const dy = next.y - pt.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={i}
                  style={[lineStyle.segment, {
                    left: pt.x,
                    top: pt.y + 5,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: color + '50',
                  }]}
                />
              );
            })}
            {plotWidth > 0 && points.map((pt, i) => (
              <View key={i} style={[lineStyle.dot, { left: pt.x - 5, top: pt.y, backgroundColor: color }]}>
                {i === points.length - 1 && <View style={[lineStyle.dotPulse, { borderColor: color }]} />}
              </View>
            ))}
          </View>

          {showAxes && (
            <>
              <View style={[lineStyle.axisLine, { borderTopColor: C.border }]} />
              <View style={lineStyle.labels}>
                {(labels || data.map((_, i) => String(i))).map((lab, i) => (
                  <Text key={i} style={[lineStyle.tickLabel, { color: C.textHint }]}>{lab}</Text>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const PieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const C = useColors();
  return (
    <View style={pie.container}>
      <View style={pie.legend}>
        {data.map((item, i) => (
          <View key={i} style={pie.legendRow}>
            <View style={[pie.dot, { backgroundColor: item.color }]} />
            <Text style={[pie.legendLabel, { color: C.textSecondary }]}>{item.label}</Text>
            <View style={[pie.barTrack, { backgroundColor: C.border }]}>
              <View style={[pie.barFill, { width: `${item.value}%` as any, backgroundColor: item.color }]} />
            </View>
            <Text style={[pie.legendValue, { color: item.color }]}>{item.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const bar = StyleSheet.create({
  container: { marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  axis: { width: 40, paddingRight: 8, alignItems: 'flex-end', justifyContent: 'space-between' },
  axisLabel: { fontSize: 10, textAlign: 'right' },
  axisLine: { borderTopWidth: 1, marginTop: 4 },
  plot: { flex: 1 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP },
  barGroup: { alignItems: 'center', justifyContent: 'flex-end' },
  valueLabel: { fontSize: 9, marginBottom: 3, fontWeight: '600' },
  barWrap: { borderRadius: 6, overflow: 'hidden' },
  bar: { flex: 1, borderRadius: 6 },
  labels: { flexDirection: 'row', gap: BAR_GAP, marginTop: 5 },
  barLabel: { fontSize: 9, textAlign: 'center' },
});

const lineStyle = StyleSheet.create({
  container: { marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  axis: { width: 42, paddingRight: 8, alignItems: 'flex-end', justifyContent: 'space-between' },
  axisLabel: { fontSize: 10, textAlign: 'right' },
  axisLine: { borderTopWidth: 1, marginTop: 12 },
  plotCol: { flex: 1 },
  // Los puntos van en absoluto: el area necesita altura propia o se aplasta y
  // el eje se monta sobre la linea.
  plot: { position: 'relative' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tickLabel: { fontSize: 11 },
  segment: { position: 'absolute', height: 2, borderRadius: 1, transformOrigin: 'left center' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  dotPulse: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 2, opacity: 0.35, top: -4, left: -4 },
});

const pie = StyleSheet.create({
  container: { gap: 10 },
  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, width: 80 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  legendValue: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
});

type Point = { label: string; value: number };
type PieItem = { label: string; value: number; color: string };

/** 'YYYY-MM-DD' o 'YYYY-MM' a Date local (sin saltos de zona horaria). */
const parseDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const SECTION_KEYS: Record<string, TranslationKey> = {
  HOME: 'sectionHome',
  TRANSLATION: 'sectionTranslation',
  ALPHABET: 'sectionAlphabet',
  LEXICON: 'sectionLexicon',
  HISTORY: 'sectionHistory',
  PROFILE: 'sectionProfile',
  SETTINGS: 'sectionSettings',
  NOTIFICATIONS: 'sectionNotifications',
  ACHIEVEMENTS: 'sectionAchievements',
  ADMIN: 'sectionAdmin',
};

const SECTION_COLORS = ['#7C5AD6', '#2F8D9E', '#2F8F6F', '#4F63C8', '#C0862B', '#B5527A', '#6B7280', '#3F8FBF'];

const ChartOrEmpty: React.FC<{ empty: boolean; text: string; children: React.ReactNode }> = ({ empty, text, children }) => {
  const C = useColors();
  if (!empty) return <>{children}</>;
  return <Text style={{ color: C.textHint, fontSize: 13, paddingVertical: 24, textAlign: 'center' }}>{text}</Text>;
};

const CardinalityTable: React.FC<{
  rows: { label: string; value: string | number; color?: string }[];
  compact?: boolean;
}> = ({ rows, compact }) => {
  const C = useColors();

  if (compact) {
    const displayRows = rows.slice(0, 3);
    return (
      <View style={[tbl.compactContainer, { backgroundColor: C.inputBg }]}>
        {displayRows.map((row, i) => (
          <View key={i} style={[tbl.compactRow, i % 2 === 0 && { backgroundColor: C.surface }]}>
            <View style={tbl.compactLeft}>
              <View style={[tbl.compactDot, row.color ? { backgroundColor: row.color } : { backgroundColor: C.primary }]} />
              <Text style={[tbl.compactLabel, { color: C.textPrimary }]} numberOfLines={1}>{row.label}</Text>
            </View>
            <Text style={[tbl.compactValue, { color: row.color || C.primary }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[tbl.container, { backgroundColor: C.inputBg, borderColor: C.border }]}>
      <View style={[tbl.header, { borderBottomColor: C.border }]}>
        <Text style={[tbl.headerCell, { color: C.textSecondary, flex: 2 }]}>Categoría</Text>
        <Text style={[tbl.headerCell, { color: C.textSecondary }]}>Valor</Text>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[tbl.row, i % 2 === 0 && { backgroundColor: C.surface }, { borderBottomColor: C.border }]}>
          <View style={[tbl.colorDot, row.color ? { backgroundColor: row.color } : { backgroundColor: C.primary }]} />
          <Text style={[tbl.cell, { color: C.textPrimary, flex: 2 }]}>{row.label}</Text>
          <Text style={[tbl.cellValue, { color: row.color || C.primary }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
};

const tbl = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, marginTop: 16 },
  header: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  headerCell: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  cell: { fontSize: 13 },
  cellValue: { fontSize: 13, fontWeight: '700', width: 60, textAlign: 'right' },

  compactContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  compactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  compactLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  compactDot: { width: 8, height: 8, borderRadius: 4 },
  compactLabel: { fontSize: 12, flex: 1 },
  compactValue: { fontSize: 12, fontWeight: '700', width: 52, textAlign: 'right' },
});

interface StatCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, subtitle, icon, children, onPress }) => {
  const C = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.85 : 1} style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: C.textHint }]}>{subtitle}</Text>
        </View>
        <View style={[styles.cardHeadIcon, { backgroundColor: C.primaryBg }]}>
          <Ionicons name={icon} size={19} color={C.primary} />
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );
};

type CardKey = 'weekly' | 'monthly' | 'volume' | 'section';

interface DetailModalProps {
  cardKey: CardKey | null;
  onClose: () => void;
  sectionPie: PieItem[];
  weekly: Point[];
  monthly: Point[];
  volume: Point[];
  emptyText: string;
  titles: Record<CardKey, string>;
  descriptions: Record<CardKey, string>;
}

const DetailModal: React.FC<DetailModalProps> = ({ cardKey, onClose, sectionPie, weekly, monthly, volume, emptyText, titles, descriptions }) => {
  const C = useColors();
  const { width } = useWindowDimensions();
  const sheetMaxWidth = Math.min(960, Math.max(320, width - 80));

  if (!cardKey) return null;

  const weeklyRows = weekly.map(d => ({ label: d.label, value: d.value, color: C.primary }));
  const monthlyRows = monthly.map(d => ({ label: d.label, value: d.value, color: C.primary }));
  const volumeRows = volume.map(d => ({ label: d.label, value: d.value, color: '#2F8D9E' }));
  const sectionRows = sectionPie.map(d => ({ label: d.label, value: `${d.value}%`, color: d.color }));

  const renderChart = () => {
    const empty =
      (cardKey === 'weekly' && weekly.length === 0) ||
      (cardKey === 'monthly' && monthly.length === 0) ||
      (cardKey === 'volume' && volume.length === 0) ||
      (cardKey === 'section' && sectionPie.length === 0);
    if (empty) return <Text style={[modal.desc, { color: C.textHint }]}>{emptyText}</Text>;
    switch (cardKey) {
      case 'weekly':
        return (
          <>
            <BarChart data={weekly} colors={[C.primaryLight, C.primary]} showAxes />
            <CardinalityTable rows={weeklyRows} />
          </>
        );
      case 'monthly':
        return (
          <>
            <LineChart data={monthly.map(d => d.value)} color={C.primary} labels={monthly.map(d => d.label)} showAxes height={160} />
            <CardinalityTable rows={monthlyRows} />
          </>
        );
      case 'volume':
        return (
          <>
            <BarChart data={volume} colors={['#5BB8C9', '#2F8D9E']} showAxes />
            <CardinalityTable rows={volumeRows} />
          </>
        );
      case 'section':
        return (
          <>
            <PieChart data={sectionPie} />
            <CardinalityTable rows={sectionRows} />
          </>
        );
    }
  };

  return (
    <Modal visible={!!cardKey} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modal.overlay}>
          <TouchableWithoutFeedback>

            <View style={[modal.sheet, { backgroundColor: C.surface, width: sheetMaxWidth }]}>

              <View style={[modal.header, { borderBottomColor: C.border }]}>
                <Text style={[modal.title, { color: C.textPrimary }]}>{titles[cardKey]}</Text>
                <TouchableOpacity onPress={onClose} style={[modal.closeBtn, { backgroundColor: C.inputBg }]}>
                  <Ionicons name="close" size={18} color={C.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={modal.scroll}
                contentContainerStyle={modal.body}
                showsVerticalScrollIndicator
                bounces={false}
              >
                {renderChart()}
                <Text style={[modal.desc, { color: C.textSecondary }]}>{descriptions[cardKey]}</Text>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },

  sheet: { width: '100%', maxWidth: 560, maxHeight: '85%', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: '800' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // En React Native un hijo no encoge por defecto: sin flexShrink el scroll
  // media lo que mide su contenido, la hoja lo recortaba con overflow hidden y
  // no se podia arrastrar para ver el resto de la tabla.
  scroll: { flexShrink: 1 },
  body: { padding: 16, paddingBottom: 24, gap: 12 },
  desc: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});

export const StatsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const C = useColors();
  const { isDark } = useTheme();
  const { t, language } = useTranslation();
  const [openCard, setOpenCard] = useState<CardKey | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setStats(await statsService.getAll());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Se recarga cada vez que la pantalla recibe el foco.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const retry = () => {
    setLoading(true);
    void load();
  };

  const fmt = (n: number) => new Intl.NumberFormat(language).format(n);
  const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) => parseDate(iso).toLocaleDateString(language, opts);
  const nonZero = (pts: Point[]) => (pts.some(p => p.value > 0) ? pts : []);

  const weekly: Point[] = nonZero((stats?.translations.daily ?? []).map(d => ({ label: fmtDate(d.date, { weekday: 'short' }), value: d.count })));
  const monthly: Point[] = nonZero((stats?.translations.monthly ?? []).map(d => ({ label: fmtDate(d.month, { month: 'short' }), value: d.count })));
  const volume: Point[] = nonZero((stats?.translations.weekly ?? []).map(d => ({ label: fmtDate(d.weekStart, { day: 'numeric', month: 'short' }), value: d.count })));

  const sectionRows = (stats?.sections.sections ?? []).filter(r => r.visits > 0);
  const totalVisits = sectionRows.reduce((sum, r) => sum + r.visits, 0);
  const SECTION_PIE: PieItem[] = sectionRows
    .slice()
    .sort((a, b) => b.visits - a.visits)
    .map((r, i) => ({
      label: SECTION_KEYS[r.section] ? t(SECTION_KEYS[r.section]) : r.section,
      value: Math.round((r.visits / totalVisits) * 100),
      color: SECTION_COLORS[i % SECTION_COLORS.length],
    }));

  // Una sola rampa de color: violeta -> indigo -> cian -> verde.
  const KPI_CARDS = stats ? [
    { label: t('kpiTranslations'),     value: fmt(stats.translations.totalTranslations), icon: 'swap-horizontal-outline' as const, gradient: ['#A78BFA', '#7C5AD6'] as [string, string] },
    { label: t('kpiActiveUsers'),      value: fmt(stats.translations.activeUsers30d),    icon: 'people-outline' as const,          gradient: ['#7C93F0', '#4F63C8'] as [string, string] },
    { label: t('kpiRegisteredUsers'),  value: fmt(stats.users.totalUsers),               icon: 'person-add-outline' as const,      gradient: ['#5BB8C9', '#2F8D9E'] as [string, string] },
    { label: t('kpiSectionVisits'),    value: fmt(totalVisits),                          icon: 'eye-outline' as const,             gradient: ['#63C2A0', '#2F8F6F'] as [string, string] },
  ] : [];

  const titles: Record<CardKey, string> = {
    weekly:  t('statsWeeklyTitle'),
    monthly: t('statsMonthlyTitle'),
    volume:  t('statsVolumeTitle'),
    section: t('statsSectionTitle'),
  };

  const descriptions: Record<CardKey, string> = {
    weekly:  t('statsWeeklyDesc'),
    monthly: t('statsMonthlyDesc'),
    volume:  t('statsVolumeDesc'),
    section: t('statsSectionDesc'),
  };

  return (
    <View style={[styles.root, { backgroundColor: C.backgroundGray }]}>
      <AppHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
        <View style={[styles.innerWrapper, isDesktop && styles.innerWrapperWide]}>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroBadge, { backgroundColor: C.primaryBg }]}>
              <Ionicons name="bar-chart-outline" size={14} color={C.primary} />
              <Text style={[styles.heroBadgeText, { color: C.primaryDark }]}>Panel de métricas</Text>
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Estadísticas</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Resumen de uso de la plataforma.
            </Text>
          </View>

          {loading && !stats && (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          )}

          {failed && !stats && !loading && (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={32} color={C.textHint} />
              <Text style={[styles.stateText, { color: C.textSecondary }]}>{t('statsLoadError')}</Text>
              <TouchableOpacity onPress={retry} style={[styles.retryBtn, { backgroundColor: C.primary }]}>
                <Text style={styles.retryText}>{t('statsRetry')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {stats && (
          <>
          <View style={[styles.kpiGrid, isTablet && styles.kpiGridDesktop]}>
            {KPI_CARDS.map((kpi, i) => (
              <LinearGradient
                key={i}
                colors={kpi.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.kpiCard, isTablet && styles.kpiCardDesktop, { shadowColor: kpi.gradient[1] }]}
              >
                <View style={styles.kpiBlob} />
                <View style={styles.kpiIconBox}>
                  <Ionicons name={kpi.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
              </LinearGradient>
            ))}
          </View>

          <View style={[styles.cardsGrid, isTablet && styles.cardsGridTablet]}>
            <StatCard title={t('statsWeeklyTitle')} subtitle={t('statsWeeklyDesc')} icon="bar-chart-outline" onPress={() => setOpenCard('weekly')}>
              <ChartOrEmpty empty={weekly.length === 0} text={t('statsEmpty')}><BarChart data={weekly} colors={[C.primaryLight, C.primary]} /></ChartOrEmpty>
            </StatCard>

            <StatCard title={t('statsMonthlyTitle')} subtitle={t('statsMonthlyDesc')} icon="trending-up-outline" onPress={() => setOpenCard('monthly')}>
              <ChartOrEmpty empty={monthly.length === 0} text={t('statsEmpty')}><LineChart data={monthly.map(d => d.value)} color={C.primary} /></ChartOrEmpty>
            </StatCard>

            <StatCard title={t('statsVolumeTitle')} subtitle={t('statsVolumeDesc')} icon="pulse-outline" onPress={() => setOpenCard('volume')}>
              <ChartOrEmpty empty={volume.length === 0} text={t('statsEmpty')}><BarChart data={volume} colors={[C.primaryLight, C.primary]} /></ChartOrEmpty>
            </StatCard>

            <StatCard title={t('statsSectionTitle')} subtitle={t('statsSectionDesc')} icon="pie-chart-outline" onPress={() => setOpenCard('section')}>
              <ChartOrEmpty empty={SECTION_PIE.length === 0} text={t('statsEmpty')}><PieChart data={SECTION_PIE} /></ChartOrEmpty>
            </StatCard>
          </View>
          </>
          )}

        </View>
      </ScrollView>

      <DetailModal
        cardKey={openCard}
        onClose={() => setOpenCard(null)}
        sectionPie={SECTION_PIE}
        weekly={weekly}
        monthly={monthly}
        volume={volume}
        emptyText={t('statsEmpty')}
        titles={titles}
        descriptions={descriptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.backgroundGray },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  contentDesktop: { paddingHorizontal: 40, paddingVertical: 32 },
  innerWrapper: { width: '100%', gap: 20 },
  innerWrapperWide: { maxWidth: 1200, alignSelf: 'center' },

  hero: { gap: 10, marginBottom: 4 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999,
  },
  heroBadgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 16, lineHeight: 24, maxWidth: 520 },

  stateBox: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  stateText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  kpiGridDesktop: { flexWrap: 'nowrap' },
  kpiCard: {
    flex: 1, minWidth: '45%', borderRadius: 20, padding: 22, overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 24, elevation: 6,
  },
  kpiCardDesktop: { minWidth: 0 },
  kpiBlob: { position: 'absolute', right: -20, top: -20, width: 96, height: 96, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
  kpiIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  kpiValue: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 3 },

  cardsGrid: { gap: 22 },
  cardsGridTablet: { flexDirection: 'row', flexWrap: 'wrap' },

  card: { flex: 1, minWidth: 280, borderRadius: 20, borderWidth: 1, padding: 26, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 22, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 22 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  cardSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardHeadIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});

