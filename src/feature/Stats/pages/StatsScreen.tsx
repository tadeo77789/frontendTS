
import React, { useState } from 'react';
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
} from 'react-native';
import { AppHeader } from '../../../shared/components/common/AppHeader';
import { Colors } from '../../../shared/constants/colors';
import { useColors, useTheme } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BarChart: React.FC<{
  data: { label: string; value: number }[];
  colors: [string, string];
  maxValue?: number;
  showAxes?: boolean;
}> = ({ data, colors, maxValue, showAxes }) => {
  const C = useColors();
  const max = maxValue || Math.max(...data.map(d => d.value));
  const chartHeight = 100;
  const axisWidth = showAxes ? 40 : 0;

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max * (ticks - i)) / ticks));

  return (
    <View style={bar.container}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: '100%' }}>
        {showAxes && (
          <View style={{ width: axisWidth, alignItems: 'flex-end', paddingRight: 8 }}>
            {tickValues.map((tv, i) => (
              <Text key={i} style={[bar.axisLabel, { color: C.textHint, height: (chartHeight / ticks) }]}>{tv}</Text>
            ))}
          </View>
        )}

        <View style={[bar.chart, { flex: 1, height: chartHeight + 30 }]}>
          {data.map((item, i) => (
            <View key={i} style={bar.barGroup}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[bar.valueLabel, { color: C.textHint }]}>{item.value}</Text>

                <View style={[bar.barWrap, { height: Math.max(4, (item.value / max) * chartHeight) }]}>
                  <LinearGradient colors={colors} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={bar.bar} />
                </View>
              </View>
              <Text style={[bar.barLabel, { color: C.textHint }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {showAxes && (
        <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: showAxes ? axisWidth : 0 }}>
          <View style={{ width: 0 }} />
          <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: C.border }} />
        </View>
      )}
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

  const [containerWidth, setContainerWidth] = useState(0);
  const max = Math.max(...data);
  const chartHeight = height || 80;
  const step = containerWidth / (data.length - 1 || 1);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  };

  if (containerWidth === 0) {
    return <View style={{ height: chartHeight }} onLayout={handleLayout} />;
  }

  const points = data.map((v, i) => ({
    x: i * step,
    y: chartHeight - (v / max) * chartHeight,
  }));

  const ticks = 4;
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max * (ticks - i)) / ticks));

  return (
    <View style={[lineStyle.container, { height: chartHeight + (showAxes ? 40 : 20) }]} onLayout={handleLayout}>
      {showAxes && (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: showAxes ? 34 : 0, width: 42, justifyContent: 'space-between', paddingVertical: 4 }}>
          {tickValues.map((tv, i) => (
            <Text key={i} style={[lineStyle.axisLabel, { color: '#8a8a8a', fontSize: 10 }]}>{tv}</Text>
          ))}
        </View>
      )}

      <View style={{ marginLeft: showAxes ? 48 : 0 }}>
        {points.slice(0, -1).map((pt, i) => {
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
        {points.map((pt, i) => (
          <View key={i} style={[lineStyle.dot, { left: pt.x - 5, top: pt.y, backgroundColor: color }]}>
            {i === points.length - 1 && <View style={[lineStyle.dotPulse, { borderColor: color }]} />}
          </View>
        ))}

        {showAxes && (
          <View style={{ marginTop: 12 }}>
            <View style={{ borderTopWidth: 1, borderTopColor: '#e0e0e0' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              {(labels || data.map((_, i) => String(i))).map((lab, i) => (
                <Text key={i} style={{ fontSize: 11, color: '#8a8a8a' }}>{lab}</Text>
              ))}
            </View>
          </View>
        )}
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
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 130 },
  barGroup: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  valueLabel: { fontSize: 9, marginBottom: 3, fontWeight: '600' },
  barWrap: { width: '80%', borderRadius: 6, overflow: 'hidden' },
  bar: { flex: 1, borderRadius: 6 },
  barLabel: { fontSize: 9, marginTop: 5 },
  axisLabel: { fontSize: 10, textAlign: 'right' },
});

const lineStyle = StyleSheet.create({
  container: { position: 'relative', width: '100%', overflow: 'hidden' },
  segment: { position: 'absolute', height: 2, borderRadius: 1, transformOrigin: 'left center' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  dotPulse: { position: 'absolute', width: 18, height: 18, borderRadius: 9, borderWidth: 2, opacity: 0.35, top: -4, left: -4 },
  axisLabel: { fontSize: 10, color: '#8a8a8a' },
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

const WEEKLY_DATA = [
  { label: 'Lun', value: 30 },
  { label: 'Mar', value: 45 },
  { label: 'Mié', value: 38 },
  { label: 'Jue', value: 52 },
  { label: 'Vie', value: 60 },
  { label: 'Sáb', value: 80 },
  { label: 'Dom', value: 70 },
];

const MONTHLY_LINE = [10, 15, 20, 28, 35, 42, 50, 55, 62, 68, 74, 80];
const MONTHLY_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const VOLUME_DATA = [
  { label: 'Sem 1', value: 20 },
  { label: 'Sem 2', value: 28 },
  { label: 'Sem 3', value: 35 },
  { label: 'Sem 4', value: 45 },
];

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
  sectionPie: { label: string; value: number; color: string }[];
  titles: Record<CardKey, string>;
  descriptions: Record<CardKey, string>;
}

const DetailModal: React.FC<DetailModalProps> = ({ cardKey, onClose, sectionPie, titles, descriptions }) => {
  const C = useColors();
  const { width } = useWindowDimensions();
  const sheetMaxWidth = Math.min(960, Math.max(320, width - 80));

  if (!cardKey) return null;

  const weeklyRows = WEEKLY_DATA.map(d => ({ label: d.label, value: d.value, color: C.primary }));
  const monthlyRows = MONTHLY_LINE.map((v, i) => ({ label: MONTHLY_LABELS[i], value: v, color: C.primary }));
  const volumeRows = VOLUME_DATA.map(d => ({ label: d.label, value: d.value, color: '#06B6D4' }));
  const sectionRows = sectionPie.map(d => ({ label: d.label, value: `${d.value}%`, color: d.color }));

  const renderChart = () => {
    switch (cardKey) {
      case 'weekly':
        return (
          <>
            <BarChart data={WEEKLY_DATA} colors={[C.primaryLight, C.primary]} showAxes />
            <CardinalityTable rows={weeklyRows} />
          </>
        );
      case 'monthly':
        return (
          <>
            <LineChart data={MONTHLY_LINE} color={C.primary} labels={MONTHLY_LABELS} showAxes height={160} />
            <CardinalityTable rows={monthlyRows} />
          </>
        );
      case 'volume':
        return (
          <>
            <BarChart data={VOLUME_DATA} colors={['#67E8F9', '#06B6D4']} showAxes />
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

              <ScrollView contentContainerStyle={modal.body} showsVerticalScrollIndicator={false}>
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

  body: { padding: 16, paddingBottom: 24, gap: 12 },
  desc: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});

export const StatsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const C = useColors();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [openCard, setOpenCard] = useState<CardKey | null>(null);

  const SECTION_PIE = [
    { label: t('sectionTranslation'), value: 47, color: '#10B981' },
    { label: t('sectionAlphabet'),    value: 29, color: '#10B981' },
    { label: t('sectionHistory'),     value: 24, color: '#10B981' },
  ];

  const weeklyRows = WEEKLY_DATA.map(d => ({ label: d.label, value: d.value, color: C.primary }));
  const monthlyRows = MONTHLY_LINE.map((v, i) => ({ label: MONTHLY_LABELS[i], value: v, color: C.primary }));
  const volumeRows = VOLUME_DATA.map(d => ({ label: d.label, value: d.value, color: '#10B981' }));
  const sectionRows = SECTION_PIE.map(d => ({ label: d.label, value: `${d.value}%`, color: d.color }));

  const KPI_CARDS = [
    { label: t('kpiTranslations'),  value: '1,248', icon: 'swap-horizontal-outline' as const, gradient: ['#A78BFA', '#734CCC'] as [string, string], glow: 'rgba(139,92,246,0.30)' },
    { label: t('kpiActiveUsers'),   value: '342',   icon: 'people-outline' as const,          gradient: ['#60A5FA', '#3B82F6'] as [string, string], glow: 'rgba(59,130,246,0.28)' },
    { label: t('kpiSignsLearned'),  value: '84',    icon: 'hand-left-outline' as const,      gradient: ['#49B9B4', '#3A9D98'] as [string, string], glow: 'rgba(73,185,180,0.28)' },
    { label: t('kpiSignsLearned'),  value: '84',    icon: 'hand-left-outline' as const,      gradient: ['#6793A9', '#527B8F'] as [string, string], glow: 'rgba(103,147,169,0.28)' },
  ];

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
              Resumen de uso de la plataforma y tu progreso aprendiendo lengua de señas.
            </Text>
          </View>

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
              <BarChart data={WEEKLY_DATA} colors={[C.primaryLight, C.primary]} />
            </StatCard>

            <StatCard title={t('statsMonthlyTitle')} subtitle={t('statsMonthlyDesc')} icon="trending-up-outline" onPress={() => setOpenCard('monthly')}>
              <LineChart data={MONTHLY_LINE} color={C.primary} />
            </StatCard>

            <StatCard title={t('statsVolumeTitle')} subtitle={t('statsVolumeDesc')} icon="pulse-outline" onPress={() => setOpenCard('volume')}>
              <BarChart data={VOLUME_DATA} colors={[C.primaryLight, C.primary]} />
            </StatCard>

            <StatCard title={t('statsSectionTitle')} subtitle={t('statsSectionDesc')} icon="pie-chart-outline" onPress={() => setOpenCard('section')}>
              <PieChart data={SECTION_PIE} />
            </StatCard>
          </View>

        </View>
      </ScrollView>

      <DetailModal
        cardKey={openCard}
        onClose={() => setOpenCard(null)}
        sectionPie={SECTION_PIE}
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

