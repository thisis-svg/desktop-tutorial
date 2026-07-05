/**
 * TikTok Creative Center からトレンドデータ(ハッシュタグ・楽曲)を取得して
 * data/trends.json を更新するスクリプト。
 *
 * Creative Center のAPIは直接呼ぶと 40101 (no permission) になるため、
 * Playwright で実際にページを開き、ページ自身が受信したAPIレスポンスを
 * 横取りする方式をとる。地域の切り替えはページ上のセレクタをUI操作する。
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
const REGION_LABELS = { JP: "Japan", US: "United States" };

const HASHTAG_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en";
const MUSIC_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/music/pc/en";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function pick(obj, keys, dflt = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return dflt;
}

function parseHashtags(body) {
  const items = body?.data?.list ?? [];
  return items
    .map((it, i) => {
      const name = pick(it, ["hashtag_name", "name"]);
      if (!name) return null;
      return {
        rank: pick(it, ["rank"], i + 1),
        name,
        posts: pick(it, ["publish_cnt", "publish_count"]),
        views: pick(it, ["video_views", "video_view_count"]),
        url: `https://www.tiktok.com/tag/${encodeURIComponent(name)}`,
      };
    })
    .filter(Boolean);
}

function parseSongs(body) {
  const items = body?.data?.sound_list ?? body?.data?.list ?? [];
  return items
    .map((it, i) => {
      const title = pick(it, ["title", "song_name"]);
      if (!title) return null;
      return {
        rank: pick(it, ["rank"], i + 1),
        title,
        author: pick(it, ["author", "artist_name"], ""),
        url:
          pick(it, ["link", "song_link"]) ||
          `https://www.tiktok.com/search?q=${encodeURIComponent(title)}`,
        cover: pick(it, ["cover", "cover_url"], ""),
      };
    })
    .filter(Boolean);
}

/**
 * ページ上の地域セレクタを操作して指定の地域に切り替える。
 * UIの構造が変わっても動くよう、複数のセレクタ候補を順に試す。
 */
async function switchRegion(page, regionLabel) {
  // 現在選択中の地域名が表示されている要素をクリックしてドロップダウンを開く
  const openCandidates = [
    `.byted-select`,
    `[class*="Select"][class*="single"]`,
    `[class*="select"]`,
  ];
  let opened = false;
  for (const sel of openCandidates) {
    const el = page.locator(sel).first();
    try {
      await el.click({ timeout: 4000 });
      opened = true;
      break;
    } catch {
      /* 次の候補へ */
    }
  }
  if (!opened) throw new Error("地域セレクタが見つかりません");

  // ドロップダウン内の目的の地域をクリック
  const optionCandidates = [
    page.locator(`[role="option"]`, { hasText: regionLabel }).first(),
    page.locator(`li`, { hasText: regionLabel }).first(),
    page.getByText(regionLabel, { exact: true }).first(),
  ];
  for (const opt of optionCandidates) {
    try {
      await opt.click({ timeout: 4000 });
      return;
    } catch {
      /* 次の候補へ */
    }
  }
  throw new Error(`地域オプション「${regionLabel}」をクリックできません`);
}

/**
 * ページを操作しながら、成功した(code=0)APIレスポンスを地域ごとに収集する。
 * @param apiPathPart 監視対象APIのURL部分文字列 (例: "hashtag/list")
 */
async function collectByRegion(context, pageUrl, apiPathPart, parse, diagLabel) {
  const page = await context.newPage();
  const collected = {}; // country_code -> parsed items
  let lastCountry = null;

  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes(apiPathPart)) return;
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* JSON以外は無視 */
    }
    const country = new URL(url).searchParams.get("country_code") || "unknown";
    console.log(
      `[${diagLabel}] API応答: status=${res.status()} code=${body?.code} country=${country} ${url.slice(0, 140)}`
    );
    if (body?.code === 0) {
      const items = parse(body);
      if (items.length) {
        // 同じ地域は最新(=より多い件数側)を優先
        if (!collected[country] || items.length >= collected[country].length) {
          collected[country] = items;
        }
        lastCountry = country;
      }
    }
  });

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(8000); // 初期ロードのAPI応答を待つ

    console.log(`[${diagLabel}] 初期ロード後の取得地域:`, Object.keys(collected).join(", ") || "なし");

    // 診断: 署名付きリクエストの有無、SSRデータの有無を記録
    const globals = await page.evaluate(() =>
      Object.keys(window).filter((k) => /INIT|DATA|STATE|SSR/i.test(k)).slice(0, 10)
    );
    console.log(`[${diagLabel}] 診断: window上の状態キー候補:`, globals.join(", ") || "なし");

    // 各地域に切り替えながら収集
    for (const [code, label] of Object.entries(REGION_LABELS)) {
      if (collected[code]) continue;
      try {
        await switchRegion(page, label);
        await page.waitForTimeout(6000);
        console.log(
          `[${diagLabel}] 「${label}」切替後の取得地域:`,
          Object.keys(collected).join(", ") || "なし"
        );
      } catch (e) {
        console.error(`[${diagLabel}] 地域切替失敗 (${label}): ${e.message}`);
      }
    }
  } finally {
    await page.close();
  }

  return { collected, lastCountry };
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
  const prevRegions = previous.regions ?? {};

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: UA, locale: "en-US" });

  const hashtagResult = await collectByRegion(
    context,
    HASHTAG_PAGE,
    "hashtag/list",
    parseHashtags,
    "hashtags"
  );
  const songResult = await collectByRegion(
    context,
    MUSIC_PAGE,
    "sound/rank_list",
    parseSongs,
    "songs"
  );

  await browser.close();

  const regions = {};
  let success = 0;
  let failure = 0;

  for (const code of Object.keys(REGION_LABELS)) {
    const prev = prevRegions[code] ?? {};
    const region = { hashtags: prev.hashtags ?? [], songs: prev.songs ?? [] };

    for (const [key, result] of [
      ["hashtags", hashtagResult],
      ["songs", songResult],
    ]) {
      const items = result.collected[code];
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
