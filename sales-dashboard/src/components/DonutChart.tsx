import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { CategoryDatum } from '../data/sampleData';
import { colors, spacing } from '../theme';

type Props = {
  data: CategoryDatum[];
  size?: number;
  unit?: string;
};

/**
 * ドーナツチャート。各セグメントを strokeDasharray でずらして描画する。
 * 右側に凡例（カテゴリ名・割合）を表示。
 */
export function DonutChart({ data, size = 140, unit = '' }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offsetAcc = 0;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* -90度回転で12時方向から開始 */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const color = colors.chart[i % colors.chart.length];
            const segment = (
              <Circle
                key={d.label}
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offsetAcc}
                strokeLinecap="butt"
              />
            );
            offsetAcc += dash;
            return segment;
          })}
        </G>
      </Svg>

      <View style={styles.legend}>
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(0);
          const color = colors.chart[i % colors.chart.length];
          return (
            <View key={d.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {d.label}
              </Text>
              <Text style={styles.legendValue}>
                {pct}%（{d.value}
                {unit}）
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: colors.text,
    fontSize: 13,
    flex: 1,
  },
  legendValue: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
