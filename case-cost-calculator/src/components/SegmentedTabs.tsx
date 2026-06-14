import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseId } from '../state/CaseStore';
import { colors, radius, spacing } from '../theme';

type Props = {
  value: CaseId;
  onChange: (id: CaseId) => void;
};

const TABS: { id: CaseId; label: string; color: string }[] = [
  { id: 'abl', label: 'アブレーション', color: colors.abl },
  { id: 'pm', label: 'ペースメーカー', color: colors.pm },
];

/** アブレーション / ペースメーカー を切り替えるセグメントタブ。 */
export function SegmentedTabs({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <Pressable
            key={t.id}
            style={[
              styles.tab,
              active && { backgroundColor: t.color },
            ]}
            onPress={() => onChange(t.id)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
