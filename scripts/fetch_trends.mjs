/**
 * TikTok Creative Center からトレンドデータ(ハッシュタグ・楽曲)を取得して
 * data/trends.json を更新するスクリプト。
 *
 * Creative Center のAPIは署名ヘッダー(user-sign等)が必要なため、
 * Playwright でページを実際に開き、ページが生成した認証済みヘッダーを
 * 再利用してAPIを呼び出す方式をとる。
 *
 * - 取得に失敗したセクションは前回データを維持する
 * - 全セクション失敗時は exit 1(Actions の失敗通知で気付けるように)
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "trends.json");

const REGIONS = ["JP", "US"];
const PERIOD_DAYS = 7;
const LIMIT = 30;

const HASHTAG_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en";
const MUSIC_PAGE =
  "https://ads.tiktok.com/business/creativecenter/inspiration/popular/music/pc/en";
const API_BASE = "https://ads.tiktok.com/creative_radar_api/v1/popular_trend";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** 候補キーのうち最初に値が存在するものを返す(API仕様変更への保険) */
function pick(obj, keys, dflt = null) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return dflt;
}

/** ページを開き、ページ自身が発行する creative_radar_api リクエストの認証ヘッダーを捕獲する */
async function captureHeaders(page, pageUrl) {
  const reqPromise = page.waitForRequest(
    (r) => r.url().includes("/creative_radar_api/"),
    { timeout: 60000 }
  );
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 90000 });
  const req = await reqPromise;
  const all = req.headers();
  const keep = {};
  for (const key of ["anonymous-user-id", "timestamp", "user-sign", "lang"]) {
    if (all[key]) keep[key] = all[key];
  }
  if (!keep["user-sign"]) {
    console.warn("警告: user-sign を捕獲できませんでした。ヘッダー:", Object.keys(all).join(", "));
  }
  return keep;
}

/** 捕獲したヘッダーを使い、ページのコンテキスト内からAPIを呼ぶ */
async function apiGet(page, headers, path, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE}/${path}?${qs}`;
  const body = await page.evaluate(
    async ({ url, headers }) => {
      const res = await fetch(url, { headers, credentials: "include" });
      try {
        return await res.json();
      } catch {
        return { code: -1, msg: `HTTP ${res.status} (JSONではない応答)` };
      }
    },
    { url, headers }
  );
  if (body.code !== 0) throw new Error(`API ${path} code=${body.code} msg=${body.msg}`);
  return body;
}

async function fetchHashtags(page, headers, country) {
  const body = await apiGet(page, headers, "hashtag/list", {
    page: 1,
    limit: LIMIT,
    period: PERIOD_DAYS,
    country_code: country,
    sort_by: "popular",
  });
  const items = body.data?.list ?? [];
  const result = items
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
  if (!result.length) throw new Error(`hashtag list empty for ${country}`);
  return result;
}

async function fetchSongs(page, headers, country) {
  const body = await apiGet(page, headers, "sound/rank_list", {
    page: 1,
    limit: LIMIT,
    period: PERIOD_DAYS,
    country_code: country,
    rank_type: "popular",
  });
  const items = body.data?.sound_list ?? body.data?.list ?? [];
  const result = items
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
  if (!result.length) throw new Error(`sound list empty for ${country}`);
  return result;
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
  const page = await context.newPage();

  let headers = {};
  try {
    headers = await captureHeaders(page, HASHTAG_PAGE);
    console.log("認証ヘッダーを捕獲:", Object.keys(headers).join(", "));
  } catch (e) {
    console.error("認証ヘッダーの捕獲に失敗:", e.message);
  }

  const regions = {};
  let success = 0;
  let failure = 0;
  let recapturedForSongs = false;

  for (const country of REGIONS) {
    const prev = prevRegions[country] ?? {};
    const region = { hashtags: prev.hashtags ?? [], songs: prev.songs ?? [] };

    try {
      region.hashtags = await fetchHashtags(page, headers, country);
      success++;
      console.log(`OK: ${country} hashtags (${region.hashtags.length}件)`);
    } catch (e) {
      failure++;
      console.error(`NG: ${country} hashtags: ${e.message}`);
    }

    try {
      region.songs = await fetchSongs(page, headers, country);
      success++;
      console.log(`OK: ${country} songs (${region.songs.length}件)`);
    } catch (e) {
      // 楽曲だけ署名が別の可能性があるため、音楽ページから一度だけ再捕獲して再試行
      if (!recapturedForSongs) {
        recapturedForSongs = true;
        try {
          headers = { ...headers, ...(await captureHeaders(page, MUSIC_PAGE)) };
          region.songs = await fetchSongs(page, headers, country);
          success++;
          console.log(`OK(再試行): ${country} songs (${region.songs.length}件)`);
          regions[country] = region;
          continue;
        } catch (e2) {
          failure++;
          console.error(`NG(再試行も失敗): ${country} songs: ${e2.message}`);
        }
      } else {
        failure++;
        console.error(`NG: ${country} songs: ${e.message}`);
      }
    }

    regions[country] = region;
  }

  await browser.close();

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
