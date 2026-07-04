#!/usr/bin/env python3
"""TikTok Creative Center からトレンドデータ(ハッシュタグ・楽曲)を取得して
data/trends.json を更新するスクリプト。

- 標準ライブラリのみ使用(GitHub Actions でそのまま動く)
- 非公式APIのため、取得に失敗したセクションは前回データを維持する
- 全セクションの取得に失敗した場合は exit 1(Actions の失敗通知で気付けるように)
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

API_BASE = "https://ads.tiktok.com/creative_radar_api/v1/popular_trend"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "trends.json"

REGIONS = ["JP", "US"]
PERIOD_DAYS = 7
LIMIT = 30

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ja,en;q=0.9",
}

JST = timezone(timedelta(hours=9))


def api_get(path: str, params: dict) -> dict:
    url = f"{API_BASE}/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as res:
        body = json.load(res)
    if body.get("code") not in (0, None):
        raise RuntimeError(f"API error {body.get('code')}: {body.get('msg')}")
    return body


def pick(item: dict, *keys, default=None):
    """候補キーのうち最初に値が存在するものを返す(API仕様変更への保険)。"""
    for key in keys:
        if item.get(key) not in (None, ""):
            return item[key]
    return default


def fetch_hashtags(country: str) -> list:
    body = api_get(
        "hashtag/list",
        {
            "page": 1,
            "limit": LIMIT,
            "period": PERIOD_DAYS,
            "country_code": country,
            "sort_by": "popular",
        },
    )
    items = body.get("data", {}).get("list", []) or []
    result = []
    for i, it in enumerate(items):
        name = pick(it, "hashtag_name", "name")
        if not name:
            continue
        result.append(
            {
                "rank": pick(it, "rank", default=i + 1),
                "name": name,
                "posts": pick(it, "publish_cnt", "publish_count"),
                "views": pick(it, "video_views", "video_view_count"),
                "url": f"https://www.tiktok.com/tag/{urllib.parse.quote(str(name))}",
            }
        )
    if not result:
        raise RuntimeError(f"hashtag list empty for {country}")
    return result


def fetch_songs(country: str) -> list:
    body = api_get(
        "sound/rank_list",
        {
            "page": 1,
            "limit": LIMIT,
            "period": PERIOD_DAYS,
            "country_code": country,
            "rank_type": "popular",
        },
    )
    items = body.get("data", {}).get("sound_list", []) or body.get("data", {}).get("list", []) or []
    result = []
    for i, it in enumerate(items):
        title = pick(it, "title", "song_name")
        if not title:
            continue
        link = pick(it, "link", "song_link")
        if not link:
            query = urllib.parse.quote(str(title))
            link = f"https://www.tiktok.com/search?q={query}"
        result.append(
            {
                "rank": pick(it, "rank", default=i + 1),
                "title": title,
                "author": pick(it, "author", "artist_name", default=""),
                "url": link,
                "cover": pick(it, "cover", "cover_url", default=""),
            }
        )
    if not result:
        raise RuntimeError(f"sound list empty for {country}")
    return result


def load_previous() -> dict:
    if OUT_PATH.exists():
        try:
            return json.loads(OUT_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def main() -> int:
    previous = load_previous()
    prev_regions = previous.get("regions", {})

    regions = {}
    success_count = 0
    failure_count = 0

    for country in REGIONS:
        prev = prev_regions.get(country, {})
        region = {"hashtags": prev.get("hashtags", []), "songs": prev.get("songs", [])}

        for key, fetcher in (("hashtags", fetch_hashtags), ("songs", fetch_songs)):
            try:
                region[key] = fetcher(country)
                success_count += 1
                print(f"OK: {country} {key} ({len(region[key])} items)")
            except Exception as exc:  # noqa: BLE001 - 非公式APIなので全例外を握って続行
                failure_count += 1
                print(f"NG: {country} {key}: {exc}", file=sys.stderr)
            time.sleep(1)

        regions[country] = region

    if success_count == 0:
        print("全セクションの取得に失敗しました。前回データを維持します。", file=sys.stderr)
        return 1

    now = datetime.now(JST)
    output = {
        "updated_at": now.strftime("%Y-%m-%d %H:%M JST"),
        "period_days": PERIOD_DAYS,
        "source": "TikTok Creative Center",
        "is_sample": False,
        "regions": regions,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"書き込み完了: {OUT_PATH} (成功 {success_count} / 失敗 {failure_count})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
