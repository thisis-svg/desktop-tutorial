/**
 * ダッシュボード表示用のサンプルデータ。
 * 実運用では API などから取得する想定。ここではダミー値を定義する。
 */

export type Kpi = {
  key: string;
  label: string;
  /** 表示用にフォーマット済みの値 */
  value: string;
  /** 前期比（%）。プラスは成長、マイナスは減少 */
  change: number;
};

export type TimePoint = {
  label: string;
  value: number;
};

export type CategoryDatum = {
  label: string;
  value: number;
};

/** 上部に並ぶサマリーKPI */
export const kpis: Kpi[] = [
  { key: 'revenue', label: '売上高', value: '¥12.4M', change: 12.5 },
  { key: 'orders', label: '注文数', value: '3,820', change: 8.1 },
  { key: 'users', label: 'アクティブ顧客', value: '1,240', change: 4.3 },
  { key: 'conversion', label: 'CVR', value: '3.8%', change: -0.6 },
];

/** 月次売上の推移（折れ線グラフ用、単位: 百万円） */
export const monthlyRevenue: TimePoint[] = [
  { label: '1月', value: 7.8 },
  { label: '2月', value: 8.2 },
  { label: '3月', value: 9.5 },
  { label: '4月', value: 9.1 },
  { label: '5月', value: 10.8 },
  { label: '6月', value: 11.2 },
  { label: '7月', value: 12.4 },
];

/** チャネル別売上（棒グラフ用、単位: 百万円） */
export const salesByChannel: CategoryDatum[] = [
  { label: '直営EC', value: 5.4 },
  { label: 'モール', value: 3.1 },
  { label: '店舗', value: 2.2 },
  { label: '卸', value: 1.7 },
];

/** カテゴリ別売上構成（ドーナツグラフ用、単位: 百万円） */
export const salesByCategory: CategoryDatum[] = [
  { label: 'アパレル', value: 4.8 },
  { label: '雑貨', value: 3.2 },
  { label: 'コスメ', value: 2.6 },
  { label: 'その他', value: 1.8 },
];

/** 最近の注文（リスト表示用） */
export type RecentOrder = {
  id: string;
  customer: string;
  amount: string;
  status: '完了' | '発送済' | '処理中';
};

export const recentOrders: RecentOrder[] = [
  { id: '#10428', customer: '田中 太郎', amount: '¥24,800', status: '完了' },
  { id: '#10427', customer: '佐藤 花子', amount: '¥8,300', status: '発送済' },
  { id: '#10426', customer: '鈴木 一郎', amount: '¥51,200', status: '処理中' },
  { id: '#10425', customer: '高橋 美咲', amount: '¥3,980', status: '完了' },
  { id: '#10424', customer: '伊藤 健', amount: '¥17,640', status: '発送済' },
];
