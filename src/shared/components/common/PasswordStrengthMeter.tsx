import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../app/providers/ThemeContext';
import { useTranslation } from '../../../app/config/i18n';
import { evaluatePassword, type PasswordLevel } from '../../../shared/utils/passwordStrength';

interface Props {
  password: string;
}

type FilledLevel = Exclude<PasswordLevel, 'empty'>;

export const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  const C = useColors();
  const { t } = useTranslation();

  if (!password) return null;

  const { level, checks } = evaluatePassword(password);

  const meta: Record<FilledLevel, { filled: number; color: string; label: string }> = {
    weak:   { filled: 1, color: C.error,   label: t('pwLevelWeak') },
    medium: { filled: 2, color: C.warning, label: t('pwLevelMedium') },
    strong: { filled: 3, color: C.success, label: t('pwLevelStrong') },
  };
  const current = meta[level as FilledLevel];

  const requirements = [
    { ok: checks.length, label: t('pwCheckLength') },
    { ok: checks.upper && checks.lower, label: t('pwCheckCase') },
    { ok: checks.number, label: t('pwCheckNumber') },
    { ok: checks.special, label: t('pwCheckSpecial') },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.barRow}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < current.filled ? current.color : C.border },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.levelText, { color: current.color }]}>
        {t('pwStrengthLabel')} {current.label}
      </Text>

      <View style={styles.reqList}>
        {requirements.map((r, idx) => (
          <View key={idx} style={styles.reqRow}>
            <Ionicons
              name={r.ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={r.ok ? C.success : C.textHint}
            />
            <Text style={[styles.reqText, { color: r.ok ? C.textSecondary : C.textHint }]}>
              {r.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 6,
  },
  barRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  reqList: {
    marginTop: 8,
    gap: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqText: {
    fontSize: 12,
  },
});
