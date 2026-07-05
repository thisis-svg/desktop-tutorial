/**
 * TikTok Creative Center からトレンドデータ(ハッシュタグ・楽曲)を取得して
 * data/trends.json を更新するスクリプト。
 *
 * Creative Center はSSR(サーバーサイドレンダリング)で、ランキングデータは
 * window._SSR_DATA / window._ROUTER_DATA に埋め込まれている。
 * Playwright でページを開き、この埋め込みデータを抽出する。
 * 地域指定はURLクエリパラメータの候補を試し、効いたものを使う。
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
// 地域指定に使うURLパラメータ名の候補(効いたものを採用する)
const REGION_PARAM_CANDIDATES = ["country_code", "countryCode", "region", "country"];

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

/* ---------- SSRデータからの抽出 ---------- */

/**
 * ページ内のSSR状態オブジェクトから、判定関数にマッチする
 * 「オブジェクトの配列」をすべて探して返す。
 */
async function extractArrays(page, matcherSource) {
  return await page.evaluate((matcherSrc) => {
    const matcher = new Function("item", `return (${matcherSrc})(item);`);
    const results = [];
    const seen = new Set();
    const walk = (obj, path) => {
      if (obj === null || typeof obj !== "object") return;
      if (seen.has(obj)) return;
      seen.add(obj);
      if (Array.isArray(obj)) {
        if (obj.length && obj[0] && typeof obj[0] === "object" && matcher(obj[0])) {
          results.push({ path, items: obj });
        }
        obj.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else {
        for (const [k, v] of Object.entries(obj)) walk(v, `${path}.${k}`);
      }
    };
    for (const key of ["_SSR_DATA", "_ROUTER_DATA"]) {
      try {
        if (window[key]) walk(window[key], key);
      } catch {
        /* 走査エラーは無視 */
      }
    }
    return results;
  }, matcherSource);
}

const HASHTAG_MATCHER = `(item) => typeof item === "object" && "hashtag_name" in item`;
const SONG_MATCHER = `(item) => typeof item === "object" && ("song_id" in item || ("title" in item && "author" in item))`;

function parseHashtagItems(items) {
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

function parseSongItems(items) {
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

/** ページを開いてSSRデータから最良の配列(最も件数が多いもの)を抽出 */
async function loadAndExtract(page, url, matcher, parse, diagLabel) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(3000);
  const found = await extractArrays(page, matcher);
  if (!found.length) {
    console.log(`[${diagLabel}] SSRデータ内に該当配列なし: ${url}`);
    return [];
  }
  found.sort((a, b) => b.items.length - a.items.length);
  const best = found[0];
  const parsed = parse(best.items);
  console.log(
    `[${diagLabel}] ${parsed.length}件抽出 (path=${best.path.slice(0, 100)}) 上位: ${parsed
      .slice(0, 3)
      .map((x) => x.name || x.title)
      .join(", ")}`
  );
  return parsed;
}

/**
 * 地域ごとのデータを収集する。
 * まず地域パラメータなしで読み込み、次に各候補パラメータでJPを読み込んで
 * 内容が変化するか確認し、効いたパラメータで全地域を取得する。
 */
async function collectByRegion(context, baseUrl, matcher, parse, diagLabel) {
  const page = await context.newPage();
  const collected = {};
  try {
    const defaultItems = await loadAndExtract(
      page,
      `${baseUrl}?period=${PERIOD_DAYS}`,
      matcher,
      parse,
      `${diagLabel}:default`
    );
    const defaultTop = defaultItems[0]?.name || defaultItems[0]?.title || "";

    let workingParam = null;
    for (const param of REGION_PARAM_CANDIDATES) {
      const items = await loadAndExtract(
        page,
        `${baseUrl}?period=${PERIOD_DAYS}&${param}=JP`,
        matcher,
        parse,
        `${diagLabel}:${param}=JP`
      );
      const top = items[0]?.name || items[0]?.title || "";
      if (items.length && top && top !== defaultTop) {
        workingParam = param;
        collected.JP = items;
        console.log(`[${diagLabel}] 地域パラメータ「${param}」が有効`);
        break;
      }
    }

    if (workingParam) {
      for (const code of REGIONS) {
        if (collected[code]) continue;
        const items = await loadAndExtract(
          page,
          `${baseUrl}?period=${PERIOD_DAYS}&${workingParam}=${code}`,
          matcher,
          parse,
          `${diagLabel}:${code}`
        );
        if (items.length) collected[code] = items;
      }
    } else {
      console.error(
        `[${diagLabel}] 有効な地域パラメータが見つかりません。既定地域のデータのみ使用します。`
      );
      // 既定はランナーのIPに基づく(通常US)
      if (defaultItems.length) collected.US = defaultItems;
      // 診断: 地域セレクタらしき要素を記録(次回改修のヒント用)
      const diag = await page.evaluate(() => {
        const els = [...document.querySelectorAll('[class*="elect"], [role="combobox"]')].slice(0, 8);
        return els.map((el) => `${el.tagName}.${el.className}`.slice(0, 120));
      });
      console.log(`[${diagLabel}] 診断: セレクタ候補要素:`, JSON.stringify(diag));
    }
  } finally {
    await page.close();
  }
  return collected;
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
  const context = await browser.newContext({ userAgent: UA, locale: "en-US" });

  const hashtagsByRegion = await collectByRegion(
    context,
    HASHTAG_PAGE,
    HASHTAG_MATCHER,
    parseHashtagItems,
    "hashtags"
  );
  const songsByRegion = await collectByRegion(
    context,
    MUSIC_PAGE,
    SONG_MATCHER,
    parseSongItems,
    "songs"
  );

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
