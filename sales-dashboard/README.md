# 売上ダッシュボード (Sales Dashboard)

Expo (React Native) 製の、売上・ビジネスKPIを可視化するモバイルダッシュボードアプリです。
iOS / Android / Web で動作します。

## 主な画面

- **KPIサマリー**: 売上高・注文数・アクティブ顧客・CVR を前期比つきで表示
- **月次売上の推移**: 折れ線+エリアチャート（`react-native-svg` で自作）
- **チャネル別売上**: 横棒グラフ
- **カテゴリ別売上構成**: ドーナツチャート + 凡例
- **最近の注文**: ステータスバッジつきリスト

> データは `src/data/sampleData.ts` のサンプル値です。実運用では API 等に差し替えてください。

## 技術スタック

- Expo SDK 56 / React Native 0.85 / React 19 / TypeScript
- `react-native-svg`（チャート描画）
- 外部チャートライブラリには依存せず、チャートは自作コンポーネント

## ディレクトリ構成

```
sales-dashboard/
├─ App.tsx                     # エントリ
└─ src/
   ├─ theme.ts                 # 色・余白などのトークン
   ├─ data/sampleData.ts       # サンプルデータ
   ├─ components/
   │  ├─ Card.tsx              # セクション用カード
   │  ├─ KpiCard.tsx           # KPIカード
   │  ├─ LineChart.tsx         # 折れ線+エリア
   │  ├─ BarChart.tsx          # 横棒
   │  └─ DonutChart.tsx        # ドーナツ
   └─ screens/
      └─ DashboardScreen.tsx   # ダッシュボード画面
```

## セットアップと起動

```bash
cd sales-dashboard
npm install

# 開発サーバ起動（QRコードを Expo Go アプリで読み取り）
npm start

# 各プラットフォーム
npm run android
npm run ios     # macOS が必要
npm run web     # 別途 react-dom / react-native-web の追加が必要
```

## 型チェック / ビルド確認

```bash
npx tsc --noEmit                     # 型チェック
EXPO_OFFLINE=1 npx expo export -p ios # バンドル検証（オフライン）
```

> 制限ネットワーク環境では Expo の API ホストに到達できないことがあります。
> その場合は `EXPO_OFFLINE=1` を付けてバージョンチェックをスキップしてください。
