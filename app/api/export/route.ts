// 管理者用: 全施設データを返す（将来的にはパスワード認証を追加推奨）
// robots.txt で /api/ をDisallowにしているため検索エンジンにはインデックスされない
import { NextResponse } from "next/server";
import facilitiesRaw from "@/data/facilities.json";

export async function GET() {
  return NextResponse.json(facilitiesRaw, {
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Disposition": 'attachment; filename="facilities.json"',
    },
  });
}
