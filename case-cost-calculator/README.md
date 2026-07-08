# 症例材料費 計算アプリ (Case Cost Calculator)

アブレーション／ペースメーカーの **1症例で使用した特定保険医療材料を選択 → 自動合計 → 1症例あたりの単価をその場で確認** できる Expo (React Native) 製モバイルアプリです。

## できること

- **アブレーション / ペースメーカー** をタブで切り替え、それぞれ独立に症例を組み立て
- 物品を検索して選択、**数量（個数）を増減**
- 選択した物品の **小計と総合計（1症例あたり合計）** をリアルタイム表示
- 「この症例向け」フィルタ（その手技で使う材料＋共通消耗品）／「すべて表示」を切替
- 選択内容は端末に**自動保存**（アプリを閉じても保持）

## 価格データについて

- 出典: アップロードされた Excel（特定保険医療材料 償還価格表）
- アプリが使う価格は **2026年6月〜の償還価格**（Excel の G 列）。旧価格（2024年〜, F 列）も `oldPrice` として保持
- データは `src/data/materials.ts` に自動生成（72品目 / 15製品）
- 各品目は手技カテゴリでタグ付け:
  - `abl`（アブレーション系）: 心筋焼灼術用カテーテル、心房中隔穿刺針、心腔内超音波プローブ、体外式ペースメーカー用カテーテル電極 など
  - `pm`（デバイス系）: ペースメーカー、リード、植込型除細動器、CRT-D、植込型心電図記録計 など
  - `common`（共通）: シースイントロデューサー、ダイレーター、ガイドワイヤー、止血材料 など（両手技で使用）

> ⚠️ 表示額は**償還価格（保険上の上限）**の合計です。実際の購入価格・施設の請求額とは異なる場合があります。

## 価格表の更新方法

新しい Excel が来たら、同じ列構成（C=品名, D/E=規格, G=最新償還価格）であれば
`src/data/materials.ts` を再生成するだけで更新できます。

## 技術スタック

- Expo SDK 56 / React Native 0.85 / React 19 / TypeScript
- `@react-native-async-storage/async-storage`（選択内容の永続化）
- 状態管理は React Context（`src/state/CaseStore.tsx`）

## ディレクトリ構成

```
case-cost-calculator/
├─ App.tsx
└─ src/
   ├─ theme.ts                    # デザイントークン
   ├─ format.ts                   # 金額フォーマット
   ├─ data/materials.ts           # 償還価格データ（自動生成）
   ├─ state/CaseStore.tsx         # 症例ごとの選択状態＋永続化
   ├─ components/
   │  ├─ SegmentedTabs.tsx        # アブレ/PM 切替
   │  ├─ QtyStepper.tsx           # 数量ステッパー
   │  └─ AddItemsModal.tsx        # 物品検索・追加モーダル
   └─ screens/
      └─ CalculatorScreen.tsx     # メイン画面
```

## 起動・動作確認

事前に [Node.js](https://nodejs.org/)（LTS）をインストールしておきます。

```bash
cd case-cost-calculator
npm install
```

### 方法A: ブラウザで確認（一番手軽）

```bash
npm run web
```
ブラウザが開き、PC 上でそのまま操作して合計計算を確認できます。

### 方法B: スマホ実機で確認（Expo Go）

1. スマホに「**Expo Go**」アプリをインストール（App Store / Google Play）
2. PC で `npm start` を実行
3. 表示された QR コードを Expo Go（Android）／カメラ（iOS）で読み取る

```bash
npm start
# npm run ios / npm run android（各シミュレータが必要）
```

## 検証

```bash
npx tsc --noEmit                          # 型チェック
EXPO_OFFLINE=1 npx expo export -p ios      # バンドル検証（オフライン）
```
