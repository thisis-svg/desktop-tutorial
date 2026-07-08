import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
};

/** 数量の増減ステッパー（− 値 ＋）。 */
export function QtyStepper({ value, onChange, min = 0 }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={6}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => onChange(value + 1)}
        hitSlop={6}
      >
        <Text style={styles.btnText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  btnText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  value: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
