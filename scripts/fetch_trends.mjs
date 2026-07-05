/**
 * TikTok Creative Center からトレンドデータを取得して data/trends.json を更新する。
 *
 * 新しい Trends ページ (https://ads.tiktok.com/creative/creativeCenter/trends/...)
 * はURLクエリで地域(region)と期間(period)を直接指定できる。
 * データはdiv構造のリストとして描画されるため、Playwrightでページを開き
 * 行要素のテキストから抽出する。
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
const REGIONS = ["JP", "US"];
const TRENDS_BASE = "https://ads.tiktok.com/creative/creativeCenter/trends";

// 楽曲ランキングの掲載先候補(現行UIでは廃止された可能性があるため複数試す)
const MUSIC_URL_CANDIDATES = ["music", "song", "sound"];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** "1.2M" "16.9K" "12,345" のような表示値を数値に変換 */
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

/** 「View more」ボタンを数回クリックして行を増やす(ログイン要求が出たら中断) */
async function expandList(page) {
  for (let i = 0; i < 4; i++) {
    const before = await page.locator('[class*="rose-hover"]').count();
    const btn = page.getByText("View more", { exact: true }).first();
    try {
      await btn.click({ timeout: 3000 });
    } catch {
      break;
    }
    await page.waitForTimeout(2500);
    // ログインモーダルが出たら閉じて中断
    const loginVisible = await page
      .getByText(/log in or sign up/i)
      .first()
      .isVisible()
      .catch(() => false);
    const after = await page.locator('[class*="rose-hover"]').count();
    if (after <= before) {
      if (loginVisible) await page.keyboard.press("Escape").catch(() => {});
      break;
    }
  }
}

/** 行要素(ホバー色付きのリスト行)からテキスト行の配列を抽出 */
async function extractRowLines(page) {
  return await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[class*="rose-hover"]')];
    return rows.map((row) => ({
      lines: (row.innerText || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      img: row.querySelector("img")?.src || "",
      link: row.querySelector("a")?.href || "",
    }));
  });
}

/** ハッシュタグ行: ["1", "#name", "カテゴリ...", "16.9K", "Posts", "9.7M", "Views", ...] */
function parseHashtagRows(rows) {
  const items = [];
  for (const row of rows) {
    const { lines } = row;
    const name = (lines.find((t) => /^#\S/.test(t)) || "").replace(/^#/, "").trim();
    if (!name) continue;
    const postsIdx = lines.findIndex((t) => /^posts$/i.test(t));
    const viewsIdx = lines.findIndex((t) => /^views$/i.test(t));
    items.push({
      rank: items.length + 1,
      name,
      posts: postsIdx > 0 ? parseCount(lines[postsIdx - 1]) : null,
      views: viewsIdx > 0 ? parseCount(lines[viewsIdx - 1]) : null,
      url: `https://www.tiktok.com/tag/${encodeURIComponent(name)}`,
    });
    if (items.length >= 30) break;
  }
  return items;
}

/** 楽曲行(存在する場合): 順位の次の非数値行を曲名、その次をアーティストとみなす */
function parseSongRows(rows) {
  const items = [];
  for (const row of rows) {
    const { lines } = row;
    const textLines = lines.filter((t) => !/^\d+$/.test(t));
    const [title, author = ""] = textLines;
    if (!title || /^#/.test(title)) continue; // ハッシュタグ行は除外
    items.push({
      rank: items.length + 1,
      title,
      author: /^[\d.,KMB\s]+$/i.test(author) ? "" : author,
      url: `https://www.tiktok.com/search?q=${encodeURIComponent(title)}`,
      cover: row.img || "",
    });
    if (items.length >= 30) break;
  }
  return items;
}

async function openTrendsPage(page, tab, region) {
  const url = `${TRENDS_BASE}/${tab}?period=${PERIOD_DAYS}&region=${region}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);
  return url;
}

async function collectHashtags(context) {
  const page = await context.newPage();
  const byRegion = {};
  try {
    for (const region of REGIONS) {
      await openTrendsPage(page, "hashtag", region);
      await expandList(page);
      const rows = await extractRowLines(page);
      const items = parseHashtagRows(rows);
      if (items.length) {
        byRegion[region] = items;
        console.log(
          `[hashtags] ${region}: ${items.length}件 上位: ${items
            .slice(0, 3)
            .map((x) => "#" + x.name)
            .join(", ")}`
        );
      } else {
        console.error(`[hashtags] ${region}: 0件 行数=${rows.length}`);
        console.log(`[hashtags:${region}] 行サンプル:`, JSON.stringify(rows.slice(0, 2)));
      }
    }
  } finally {
    await page.close();
  }
  return byRegion;
}

async function collectSongs(context) {
  const page = await context.newPage();
  const byRegion = {};
  try {
    // 楽曲タブのURLを探索(現行UIに存在しない可能性がある)
    let workingTab = null;
    for (const tab of MUSIC_URL_CANDIDATES) {
      const requested = await openTrendsPage(page, tab, "JP");
      const landed = page.url();
      const bodyHead = await page.evaluate(() =>
        document.body.innerText.slice(0, 400).replace(/\n+/g, " | ")
      );
      console.log(`[songs] 試行 ${requested} → 実URL ${landed}`);
      console.log(`[songs] 本文冒頭: ${bodyHead.slice(0, 300)}`);
      // リダイレクトされずに楽曲らしい行が取れるか確認
      if (landed.includes(`/${tab}`)) {
        await expandList(page);
        const rows = await extractRowLines(page);
        const items = parseSongRows(rows);
        if (items.length) {
          workingTab = tab;
          byRegion.JP = items;
          console.log(`[songs] JP: ${items.length}件 (${tab})`);
          break;
        }
      }
    }
    if (workingTab) {
      for (const region of REGIONS) {
        if (byRegion[region]) continue;
        await openTrendsPage(page, workingTab, region);
        await expandList(page);
        const items = parseSongRows(await extractRowLines(page));
        if (items.length) {
          byRegion[region] = items;
          console.log(`[songs] ${region}: ${items.length}件`);
        }
      }
    } else {
      console.error(
        "[songs] 楽曲ランキングページが見つかりません(Creative Center から廃止された可能性)。前回データを維持します。"
      );
    }
  } finally {
    await page.close();
  }
  return byRegion;
}

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
  // サンプルデータは引き継がない(実データのみ維持する)
  const prevRegions = previous.is_sample ? {} : (previous.regions ?? {});

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: UA,
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
  });

  const hashtagsByRegion = await collectHashtags(context);
  const songsByRegion = await collectSongs(context);

  await browser.close();

  const regions = {};
  let success = 0;
  let failure = 0;

  for (const code of REGIONS) {
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
