import { StyleSheet, Text, View } from 'react-native';
import { CategoryDatum } from '../data/sampleData';
import { colors, radius, spacing } from '../theme';

type Props = {
  data: CategoryDatum[];
  unit?: string;
};

/**
 * シンプルな横棒グラフ。SVGを使わず View の幅比率で表現するため軽量。
 */
export function BarChart({ data, unit = '' }: Props) {
  const max = Math.max(...data.map((d) => d.value)) || 1;

  return (
    <View style={styles.container}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = colors.chart[i % colors.chart.length];
        return (
          <View key={d.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.value}>
              {d.value}
              {unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    width: 64,
  },
  track: {
    flex: 1,
    height: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm,
  },
  value: {
    color: colors.textMuted,
    fontSize: 12,
    width: 44,
    textAlign: 'right',
  },
});
