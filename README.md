# TikTokトレンド速報

TikTokで今バズっている**急上昇ハッシュタグ**と**人気楽曲**を毎日自動更新で表示するサイトです。
自分のTikTok投稿のネタ探しと、アフィリエイト収益化を目的としています。

## 仕組み

```
GitHub Actions(毎朝6時 JST)
  → scripts/fetch_trends.py がTikTok Creative Centerからデータ取得
  → data/trends.json を更新してコミット
  → GitHub Pages が自動で再公開
```

- **サーバー代ゼロ**: GitHub Pages(静的サイト)+ GitHub Actions(無料枠)だけで動きます
- **データ出典**: [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter/pc/ja)(TikTok公式が公開しているトレンドデータ)
- **対象地域**: 日本 🇯🇵 / アメリカ 🇺🇸(過去7日間の人気ランキング、各30件)

## 初回セットアップ(2ステップ)

### 1. GitHub Pages を有効にする

1. このリポジトリの **Settings → Pages** を開く
2. 「Build and deployment」の Source を **Deploy from a branch** にする
3. Branch を **main**、フォルダを **/(root)** にして Save

数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` でサイトが公開されます。

### 2. 自動更新を動かす

- **Actions** タブを開き、ワークフローの実行を有効化(初回に確認を求められた場合)
- 「トレンドデータ毎日更新」ワークフローを選び **Run workflow** で手動実行すると、すぐに実データに切り替わります
- 以降は毎朝6時(日本時間)に自動更新されます

> 更新が失敗するとGitHubからメール通知が届きます。TikTok側のAPI仕様変更が原因の場合は `scripts/fetch_trends.py` の修正が必要です。

## アフィリエイトリンクの設定

`assets/affiliates.json` を編集して、商品名・説明・アフィリエイトリンクを入れるだけです。

```json
[
  {
    "title": "スマホ用リングライト",
    "description": "TikTok撮影の必需品。顔映りが段違いに良くなる",
    "url": "https://（ASPで発行したアフィリエイトリンク）"
  }
]
```

- `url` が空のエントリはサイトに表示されません
- リンクには自動で **PR ラベル** が付きます(ステマ規制対応)

### おすすめASP

| ASP | 特徴 |
|---|---|
| [A8.net](https://www.a8.net/) | 国内最大手。審査がゆるく初心者向け |
| [もしもアフィリエイト](https://af.moshimo.com/) | Amazon・楽天の商品を扱える |
| [楽天アフィリエイト](https://affiliate.rakuten.co.jp/) | 審査なしですぐ始められる |

## 法的な注意点(重要)

- **ステマ規制(景品表示法、2023年10月〜)**: アフィリエイトリンクには「PR」「広告」の表記が必須です。本サイトは自動で表示しますが、削除しないでください。
- **著作権**: TikTokの動画・画像を無断でサイトに転載しないでください。動画を載せたい場合はTikTok公式の埋め込み機能を使ってください。
- **データ取得**: TikTok Creative Centerの公開データを参照していますが、非公式のAPI利用のため、仕様変更で取得できなくなる可能性があります。

## ファイル構成

```
├── index.html                     # サイト本体
├── assets/
│   ├── style.css                  # デザイン
│   ├── app.js                     # データ読み込み・表示
│   └── affiliates.json            # ★アフィリエイトリンク設定(ここを編集)
├── data/
│   └── trends.json                # トレンドデータ(自動更新される)
├── scripts/
│   └── fetch_trends.py            # データ取得スクリプト
└── .github/workflows/
    └── update-trends.yml          # 毎日実行のスケジュール設定
```
