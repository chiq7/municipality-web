import { NextRequest, NextResponse } from "next/server";
import facilitiesRaw from "@/data/facilities.json";
import type { Facility, NormalizedStatus } from "@/lib/types";

const facilities = facilitiesRaw as Facility[];

// ── レート制限（インメモリ）──
// Vercelサーバーレスでは複数インスタンス間で共有されないため
// 単一インスタンス内の保護として機能します。
// 本番環境では Vercel KV (Redis) への移行を推奨します。
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60;    // リクエスト上限
const RATE_WINDOW = 60_000; // 1分（ミリ秒）
const PAGE_SIZE = 50;     // 1ページ最大件数

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// 定期的に期限切れエントリをクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap.entries()) {
    if (now > entry.reset) rateMap.delete(ip);
  }
}, 5 * 60_000);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too Many Requests. 1分後に再試行してください。" },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const { searchParams } = req.nextUrl;
  const page         = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status       = searchParams.get("status") ?? "";
  const pref         = searchParams.get("prefecture") ?? "";
  const query        = searchParams.get("query") ?? "";
  const facilityType = searchParams.get("facilityType") ?? "";
  const favOnly      = searchParams.get("favorites") === "1";
  const favIds       = searchParams.get("favIds") ?? "";

  // フィルタリング
  let filtered = facilities as Facility[];
  if (status)       filtered = filtered.filter((f) => f.normalizedStatus === (status as NormalizedStatus));
  if (pref)         filtered = filtered.filter((f) => f.prefecture === pref);
  if (facilityType) filtered = filtered.filter((f) => f.facilityType === facilityType);
  if (favOnly && favIds) {
    const ids = new Set(favIds.split(","));
    filtered = filtered.filter((f) => ids.has(f.id));
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((f) =>
      (f.facilityName + f.municipality + f.prefecture + f.keywords.join(" ") + f.excerpt)
        .toLowerCase()
        .includes(q)
    );
  }

  const total      = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const items      = filtered.slice(start, start + PAGE_SIZE);

  // スコア関連の内部フィールドを除外してレスポンス
  const safeItems = items.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ treasureScore, scoreReason, ...rest }) => rest
  );

  return NextResponse.json(
    {
      data: safeItems,
      meta: { total, page: safePage, pageSize: PAGE_SIZE, totalPages },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-RateLimit-Limit": String(RATE_LIMIT),
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
