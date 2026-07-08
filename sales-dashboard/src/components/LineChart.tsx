import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { TimePoint } from '../data/sampleData';
import { colors, spacing } from '../theme';

type Props = {
  data: TimePoint[];
  /** 値の表示単位（例: 'M' で百万） */
  unit?: string;
  height?: number;
};

/**
 * react-native-svg で描く折れ線+エリアチャート。
 * 親の幅に合わせて自動でリサイズする。
 */
export function LineChart({ data, unit = '', height = 180 }: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const paddingX = 8;
  const paddingTop = 12;
  const paddingBottom = 24; // x軸ラベル用
  const chartW = Math.max(width - paddingX * 2, 1);
  const chartH = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // 各データ点の座標を計算
  const points = data.map((d, i) => {
    const x = paddingX + (chartW * i) / Math.max(data.length - 1, 1);
    const y = paddingTop + chartH * (1 - (d.value - min) / range);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    width > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          paddingTop + chartH
        } L ${points[0].x} ${paddingTop + chartH} Z`
      : '';

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill="url(#areaFill)" />
          <Path
            d={linePath}
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill={colors.background}
              stroke={colors.primary}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : null}
      <View style={styles.labels}>
        {data.map((d) => (
          <Text key={d.label} style={styles.label}>
            {d.label}
          </Text>
        ))}
      </View>
      <Text style={styles.range}>
        最大 {max}
        {unit} / 最小 {min}
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.lg,
    paddingHorizontal: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
  },
  range: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.sm,
  },
});
