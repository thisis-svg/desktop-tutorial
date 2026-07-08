import { StyleSheet, Text, View } from 'react-native';
import { Kpi } from '../data/sampleData';
import { colors, radius, spacing } from '../theme';

type Props = {
  kpi: Kpi;
};

/** サマリー用の小さなKPIカード。前期比をプラス/マイナスで色分けする。 */
export function KpiCard({ kpi }: Props) {
  const positive = kpi.change >= 0;
  const changeColor = positive ? colors.success : colors.danger;
  const arrow = positive ? '▲' : '▼';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{kpi.label}</Text>
      <Text style={styles.value}>{kpi.value}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.change, { color: changeColor }]}>
          {arrow} {Math.abs(kpi.change).toFixed(1)}%
        </Text>
        <Text style={styles.changeNote}>前期比</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  change: {
    fontSize: 13,
    fontWeight: '700',
  },
  changeNote: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
