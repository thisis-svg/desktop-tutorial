import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AddItemsModal } from '../components/AddItemsModal';
import { QtyStepper } from '../components/QtyStepper';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { Material, materials } from '../data/materials';
import { num, yen } from '../format';
import { CaseId, useCaseStore } from '../state/CaseStore';
import { colors, radius, spacing } from '../theme';

// 物品IDから Material を引くためのマップ
const byId = new Map<string, Material>(materials.map((m) => [m.id, m]));

const TAB_COLOR: Record<CaseId, string> = { abl: colors.abl, pm: colors.pm };
const TAB_LABEL: Record<CaseId, string> = {
  abl: 'アブレーション',
  pm: 'ペースメーカー',
};

export function CalculatorScreen() {
  const { state, setQty, clear } = useCaseStore();
  const [tab, setTab] = useState<CaseId>('abl');
  const [modalOpen, setModalOpen] = useState(false);

  const selection = state[tab];

  // 選択中の物品（数量つき）と合計を算出
  const { rows, total, count } = useMemo(() => {
    const rows = Object.entries(selection)
      .map(([id, qty]) => ({ material: byId.get(id), qty }))
      .filter((r): r is { material: Material; qty: number } => !!r.material)
      .sort((a, b) => a.material.no - b.material.no);
    const total = rows.reduce((s, r) => s + r.material.price * r.qty, 0);
    const count = rows.reduce((s, r) => s + r.qty, 0);
    return { rows, total, count };
  }, [selection]);

  const onClear = () => {
    Alert.alert('クリア', `${TAB_LABEL[tab]}の選択をすべて削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => clear(tab) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerArea}>
        <Text style={styles.appTitle}>症例材料費 計算</Text>
        <Text style={styles.appSub}>償還価格 2026年6月〜（特定保険医療材料）</Text>
        <View style={styles.tabsWrap}>
          <SegmentedTabs value={tab} onChange={setTab} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 合計（1症例あたり単価） */}
        <View style={[styles.totalCard, { borderColor: TAB_COLOR[tab] }]}>
          <Text style={styles.totalLabel}>1症例あたり 合計</Text>
          <Text style={[styles.totalValue, { color: TAB_COLOR[tab] }]}>
            {yen(total)}
          </Text>
          <Text style={styles.totalMeta}>
            {rows.length}品目 / 合計{count}個
          </Text>
        </View>

        {/* 選択中の物品 */}
        {rows.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              まだ物品が選択されていません。{'\n'}
              下の「＋ 物品を追加」から選んでください。
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {rows.map((r, i) => (
              <View
                key={r.material.id}
                style={[styles.itemRow, i > 0 && styles.itemDivider]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {r.material.product}
                  </Text>
                  {r.material.variant ? (
                    <Text style={styles.itemVariant} numberOfLines={2}>
                      {r.material.variant}
                    </Text>
                  ) : null}
                  <Text style={styles.itemUnit}>
                    単価 {yen(r.material.price)} × {r.qty}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemSubtotal}>
                    {yen(r.material.price * r.qty)}
                  </Text>
                  <QtyStepper
                    value={r.qty}
                    onChange={(n) => setQty(tab, r.material.id, n)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {rows.length > 0 ? (
          <Pressable style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearText}>この症例をクリア</Text>
          </Pressable>
        ) : null}

        <Text style={styles.note}>
          ※ 表示は償還価格（保険上の上限）の合計です。実際の購入価格とは異なる場合があります。
        </Text>
      </ScrollView>

      {/* 追加ボタン */}
      <View style={styles.fabWrap}>
        <Pressable
          style={[styles.fab, { backgroundColor: TAB_COLOR[tab] }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.fabText}>＋ 物品を追加</Text>
        </Pressable>
      </View>

      <AddItemsModal
        visible={modalOpen}
        caseId={tab}
        selection={selection}
        onClose={() => setModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  appSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabsWrap: {
    marginTop: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  totalMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemUnit: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  clearBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clearText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  note: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl,
    alignItems: 'center',
  },
  fab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 1.5,
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
