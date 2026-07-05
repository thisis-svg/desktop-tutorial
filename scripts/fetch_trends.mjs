/**
 * TikTok Creative Center からトレンドデータ(ハッシュタグ・楽曲)を取得して
 * data/trends.json を更新するスクリプト。
 *
 * APIは署名必須(40101)・SSRデータにも生配列が無いため、
 * Playwright でページを開き、描画済みのDOMからカード情報を直接抽出する。
 * 地域切替はヘッダーの国セレクタ(.trends-header-country-select)をUI操作する。
 *
 * - 取得に失敗したセクションは前回データを維持する
 * - 全セクション失敗時は exit 1(Actions の失敗通知で気付けるように)
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "trends.json");

const PERIOD_DAYS = 7;
const REGIONS = { JP: "Japan", US: "United States" };

const HASHTAG_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en";
const MUSIC_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/music/pc/en";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/* ---------- ユーティリティ ---------- */

/** "1.2M" "114.4K" "12,345" のような表示値を数値に変換 */
function parseCount(text) {
  if (!text) return null;
  const m = String(text).replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const unit = (m[2] || "").toUpperCase();
  if (unit === "K") n *= 1e3;
  else if (unit === "M") n *= 1e6;
  else if (unit === "B") n *= 1e9;
  return Math.round(n);
}

async function dismissCookieBanner(page) {
  for (const label of ["Allow all", "Accept all", "Accept", "Agree", "同意"]) {
    try {
      await page.getByRole("button", { name: label }).first().click({ timeout: 1500 });
      console.log(`Cookieバナーを閉じました (${label})`);
      return;
    } catch {
      /* 次の候補へ */
    }
  }
}

/** 現在選択中の国名を返す */
async function currentRegionLabel(page) {
  try {
    return (
      (await page
        .locator(".trends-header-country-select")
        .first()
        .textContent({ timeout: 5000 })) || ""
    ).trim();
  } catch {
    return "";
  }
}

/** 国セレクタを操作して地域を切り替える */
async function switchRegion(page, label) {
  await page.locator(".trends-header-country-select").first().click({ timeout: 10000 });
  await page.waitForTimeout(600);
  // セレクタは検索入力付き。国名を入力して絞り込む
  try {
    await page.keyboard.type(label, { delay: 30 });
  } catch {
    /* 入力不可でも続行 */
  }
  await page.waitForTimeout(1000);
  // ドロップダウンの選択肢をクリック
  const option = page
    .locator('[class*="option"], [role="option"], li')
    .filter({ hasText: label })
    .last();
  await option.click({ timeout: 6000 });
  await page.waitForTimeout(5000); // データ再描画を待つ
}

/* ---------- DOM抽出 ---------- */

/** テーブル(またはrole=rowのグリッド)から行データを抽出する共通処理 */
async function scrapeRows(page) {
  // 遅延描画対策で軽くスクロール
  try {
    await page.mouse.wheel(0, 1500);
  } catch {
    /* ヘッドレスで失敗しても続行 */
  }
  await page.waitForTimeout(2000);
  return await page.evaluate(() => {
    let rows = [...document.querySelectorAll("table tbody tr")];
    if (!rows.length) rows = [...document.querySelectorAll("table tr")].slice(1);
    if (!rows.length) rows = [...document.querySelectorAll('[role="row"]')].slice(1);
    return rows
      .map((tr) => {
        const cells = [...tr.querySelectorAll('td, th, [role="cell"], [role="gridcell"]')];
        const texts = (cells.length ? cells : [tr]).map((td) => (td.innerText || "").trim());
        return {
          texts,
          img: tr.querySelector("img")?.src || "",
          link: tr.querySelector("a")?.href || "",
        };
      })
      .filter((r) => r.texts.some((t) => t));
  });
}

const scrapeHashtags = scrapeRows;
const scrapeSongs = scrapeRows;

/** 失敗解析用の診断情報をログに出す */
async function dumpDiagnostics(page, label) {
  const diag = await page.evaluate(() => {
    const ssr = (() => {
      try {
        return JSON.stringify(window._SSR_DATA ?? {});
      } catch {
        return "";
      }
    })();
    const count = (s, sub) => s.split(sub).length - 1;
    const firstCard = document.querySelector('[class*="Card"], [class*="card"]');
    return {
      bodyTextHead: document.body.innerText.slice(0, 300).replace(/\n+/g, " | "),
      ssrLen: ssr.length,
      ssrHits: {
        hashtag_name: count(ssr, "hashtag_name"),
        hashtagName: count(ssr, "hashtagName"),
        musicName: count(ssr, "musicName"),
        sound: count(ssr, "sound"),
      },
      firstCardHtml: firstCard ? firstCard.outerHTML.slice(0, 400) : "(カード要素なし)",
    };
  });
  console.log(`[${label}] 診断:`, JSON.stringify(diag).slice(0, 1200));
}

/* ---------- 収集フロー ---------- */

async function collect(context, pageUrl, scrape, normalize, diagLabel) {
  const page = await context.newPage();
  const byRegion = {};
  try {
    await page.goto(`${pageUrl}?period=${PERIOD_DAYS}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await dismissCookieBanner(page);
    await page.waitForTimeout(6000);

    for (const [code, label] of Object.entries(REGIONS)) {
      const current = await currentRegionLabel(page);
      console.log(`[${diagLabel}] 現在の地域表示: "${current}" → 目標: ${label}`);
      if (!current.includes(label)) {
        try {
          await switchRegion(page, label);
        } catch (e) {
          console.error(`[${diagLabel}] 地域切替失敗 (${label}): ${e.message}`);
          continue;
        }
      }
      const raw = await scrape(page);
      const items = normalize(raw);
      if (items.length) {
        byRegion[code] = items;
        console.log(
          `[${diagLabel}] ${code}: ${items.length}件 上位: ${items
            .slice(0, 3)
            .map((x) => x.name || x.title)
            .join(", ")}`
        );
      } else {
        console.error(`[${diagLabel}] ${code}: 0件`);
        console.log(
          `[${diagLabel}:${code}] 行サンプル:`,
          JSON.stringify(raw.slice(0, 3)).slice(0, 800)
        );
        await dumpDiagnostics(page, `${diagLabel}:${code}`);
      }
    }
  } finally {
    await page.close();
  }
  return byRegion;
}

function normalizeHashtags(rows) {
  const items = [];
  for (const row of rows) {
    const { texts } = row;
    // ハッシュタグ名: "#〜" で始まるセル、なければ2番目のセルの1行目
    let nameCellIdx = texts.findIndex((t) => /^#\s*\S/.test(t));
    if (nameCellIdx < 0) nameCellIdx = Math.min(1, texts.length - 1);
    const name = (texts[nameCellIdx] || "").split("\n")[0].replace(/^#\s*/, "").trim();
    if (!name || /^(rank|hashtag)$/i.test(name)) continue;
    // 投稿数・再生数: 名前セル以降で数値トークンを含むセルから抽出
    let posts = null;
    let views = null;
    for (let i = nameCellIdx + 1; i < texts.length; i++) {
      const tokens = texts[i].match(/[\d.,]+\s*[KMB]?(?![\w])/gi);
      if (tokens?.length) {
        posts = parseCount(tokens[0]);
        if (tokens.length > 1) views = parseCount(tokens[1]);
        break;
      }
    }
    items.push({
      rank: items.length + 1,
      name,
      posts,
      views,
      url: `https://www.tiktok.com/tag/${encodeURIComponent(name)}`,
    });
    if (items.length >= 30) break;
  }
  return items;
}

function normalizeSongs(rows) {
  const items = [];
  for (const row of rows) {
    const { texts } = row;
    // 曲名セル: 数値だけではない最初のセル(順位セルを除く)
    const cell = texts.find((t, i) => i > 0 && t && !/^[\d.,\sKMB%]+$/i.test(t)) || "";
    const [title, author = ""] = cell.split("\n").map((s) => s.trim());
    if (!title || /^(song|music|title)$/i.test(title)) continue;
    items.push({
      rank: items.length + 1,
      title,
      author,
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(title)}`,
      cover: row.img || "",
    });
    if (items.length >= 30) break;
  }
  return items;
}

/* ---------- 出力 ---------- */

function loadPrevious() {
  if (existsSync(OUT_PATH)) {
    try {
      return JSON.parse(readFileSync(OUT_PATH, "utf-8"));
    } catch {
      /* 壊れていれば無視 */
    }
  }
  return {};
}

function nowJst() {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())} JST`;
}

async function main() {
  const previous = loadPrevious();
  const prevRegions = previous.regions ?? {};

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: UA,
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
  });

  const hashtagsByRegion = await collect(
    context,
    HASHTAG_PAGE,
    scrapeHashtags,
    normalizeHashtags,
    "hashtags"
  );
  const songsByRegion = await collect(context, MUSIC_PAGE, scrapeSongs, normalizeSongs, "songs");

  await browser.close();

  const regions = {};
  let success = 0;
  let failure = 0;

  for (const code of Object.keys(REGIONS)) {
    const prev = prevRegions[code] ?? {};
    const region = { hashtags: prev.hashtags ?? [], songs: prev.songs ?? [] };

    for (const [key, byRegion] of [
      ["hashtags", hashtagsByRegion],
      ["songs", songsByRegion],
    ]) {
      const items = byRegion[code];
      if (items?.length) {
        region[key] = items;
        success++;
        console.log(`OK: ${code} ${key} (${items.length}件)`);
      } else {
        failure++;
        console.error(`NG: ${code} ${key}: データを収集できませんでした`);
      }
    }
    regions[code] = region;
  }

  if (success === 0) {
    console.error("全セクションの取得に失敗しました。前回データを維持します。");
    process.exit(1);
  }

  const output = {
    updated_at: nowJst(),
    period_days: PERIOD_DAYS,
    source: "TikTok Creative Center",
    is_sample: false,
    regions,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`書き込み完了: ${OUT_PATH} (成功 ${success} / 失敗 ${failure})`);
}

main().catch((e) => {
  console.error("予期しないエラー:", e);
  process.exit(1);
});
