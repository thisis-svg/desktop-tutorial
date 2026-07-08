import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { materials } from '../data/materials';
import { yen } from '../format';
import { CaseId, Selection, useCaseStore } from '../state/CaseStore';
import { colors, radius, spacing } from '../theme';
import { QtyStepper } from './QtyStepper';

type Props = {
  visible: boolean;
  caseId: CaseId;
  selection: Selection;
  onClose: () => void;
};

/** 物品を検索・選択して症例に追加するモーダル。 */
export function AddItemsModal({ visible, caseId, selection, onClose }: Props) {
  const { addOne, setQty } = useCaseStore();
  const [query, setQuery] = useState('');
  const [onlyRelevant, setOnlyRelevant] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim();
    return materials.filter((m) => {
      if (onlyRelevant && m.category !== caseId && m.category !== 'common') {
        return false;
      }
      if (q && !m.name.includes(q) && !String(m.no).includes(q)) return false;
      return true;
    });
  }, [query, onlyRelevant, caseId]);

  // 品名ごとにグループ化
  const groups = useMemo(() => {
    const map = new Map<string, typeof materials>();
    for (const m of filtered) {
      const key = `${m.no}|${m.product}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>物品を追加</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.done}>閉じる</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            style={styles.search}
            placeholder="品名・材料番号で検索"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />
          <Pressable
            style={[styles.chip, onlyRelevant && styles.chipActive]}
            onPress={() => setOnlyRelevant((v) => !v)}
          >
            <Text
              style={[styles.chipText, onlyRelevant && styles.chipTextActive]}
            >
              {onlyRelevant ? 'この症例向け' : 'すべて表示'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {groups.length === 0 ? (
            <Text style={styles.empty}>該当する物品がありません</Text>
          ) : (
            groups.map(([key, items]) => (
              <View key={key} style={styles.group}>
                <Text style={styles.groupTitle}>
                  <Text style={styles.groupNo}>No.{items[0].no}　</Text>
                  {items[0].product}
                </Text>
                {items.map((m) => {
                  const qty = selection[m.id] ?? 0;
                  return (
                    <View key={m.id} style={styles.row}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.variant}>
                          {m.variant || '（規格なし）'}
                        </Text>
                        <Text style={styles.price}>{yen(m.price)}</Text>
                      </View>
                      {qty > 0 ? (
                        <QtyStepper
                          value={qty}
                          onChange={(n) => setQty(caseId, m.id, n)}
                        />
                      ) : (
                        <Pressable
                          style={styles.addBtn}
                          onPress={() => addOne(caseId, m.id)}
                        >
                          <Text style={styles.addBtnText}>追加</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  done: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  search: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  chip: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
    gap: spacing.lg,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  groupNo: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  variant: {
    fontSize: 14,
    color: colors.text,
  },
  price: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
