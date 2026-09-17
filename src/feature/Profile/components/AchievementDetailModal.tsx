import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { CATEGORY_LABEL_KEYS, progressOf, type Achievement } from '../data/achievements';
import { useAchievementText } from '../hooks/useAchievementText';
import { AchievementMedal } from './AchievementMedal';
import { AchievementProgressBar } from './AchievementProgressBar';

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ achievement, onClose }) => {
  const C = useColors();
  const { t } = useTranslation();
  const { progressText, levelText, stateText } = useAchievementText();
  const { width } = useWindowDimensions();

  if (!achievement) return null;

  const { unlocked, percent } = progressOf(achievement);
  const sheetWidth = Math.min(420, Math.max(280, width - 48));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { width: sheetWidth, backgroundColor: C.surface, borderColor: C.border }]}>
              <AchievementMedal achievement={achievement} size={88} />

              <View style={[styles.badge, { backgroundColor: C.primaryBg }]}>
                <Text style={[styles.badgeText, { color: C.primaryDark }]}>
                  {t(CATEGORY_LABEL_KEYS[achievement.category])} · {levelText(achievement)}
                </Text>
              </View>

              <Text style={[styles.title, { color: C.textPrimary }]}>{t(achievement.nameKey)}</Text>
              <Text style={[styles.desc, { color: C.textSecondary }]}>{t(achievement.descKey)}</Text>

              <View style={styles.progressRow}>
                <AchievementProgressBar
                  percent={percent}
                  track={C.inputBg}
                  fill={unlocked ? C.primary : C.primaryLight}
                />
                <Text style={[styles.progressText, { color: C.primaryDark }]}>{progressText(achievement)}</Text>
              </View>

              <Text style={[styles.state, { color: C.textHint }]}>{stateText(achievement)}</Text>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: C.primaryBg, borderColor: C.borderInput }]}
              >
                <Text style={[styles.closeText, { color: C.primaryDark }]}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  desc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginTop: 4 },
  progressText: { fontSize: 13, fontWeight: '800' },
  state: { fontSize: 13, fontWeight: '700' },
  closeBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 8,
  },
  closeText: { fontSize: 15, fontWeight: '700' },
});
