import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart } from '../components/BarChart';
import { Card } from '../components/Card';
import { DonutChart } from '../components/DonutChart';
import { KpiCard } from '../components/KpiCard';
import { LineChart } from '../components/LineChart';
import {
  kpis,
  monthlyRevenue,
  recentOrders,
  RecentOrder,
  salesByCategory,
  salesByChannel,
} from '../data/sampleData';
import { colors, radius, spacing } from '../theme';

const statusColor: Record<RecentOrder['status'], string> = {
  完了: colors.success,
  発送済: colors.primary,
  処理中: colors.warning,
};

export function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>おはようございます 👋</Text>
            <Text style={styles.title}>売上ダッシュボード</Text>
          </View>
          <Text style={styles.date}>2026年6月</Text>
        </View>

        {/* KPIサマリー */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </View>

        {/* 月次売上推移 */}
        <Card title="月次売上の推移" subtitle="単位: 百万円">
          <LineChart data={monthlyRevenue} unit="M" />
        </Card>

        {/* チャネル別売上 */}
        <Card title="チャネル別売上" subtitle="単位: 百万円">
          <BarChart data={salesByChannel} unit="M" />
        </Card>

        {/* カテゴリ別構成 */}
        <Card title="カテゴリ別売上構成">
          <DonutChart data={salesByCategory} unit="M" />
        </Card>

        {/* 最近の注文 */}
        <Card title="最近の注文">
          <View style={styles.orderList}>
            {recentOrders.map((o, i) => (
              <View
                key={o.id}
                style={[
                  styles.orderRow,
                  i < recentOrders.length - 1 && styles.orderDivider,
                ]}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderCustomer}>{o.customer}</Text>
                  <Text style={styles.orderId}>{o.id}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>{o.amount}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statusColor[o.status] + '22' },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: statusColor[o.status] }]}
                    >
                      {o.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Text style={styles.footer}>サンプルデータで表示しています</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  orderList: {
    gap: 0,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  orderDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderLeft: {
    gap: 2,
  },
  orderCustomer: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  orderId: {
    color: colors.textMuted,
    fontSize: 12,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  orderAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
