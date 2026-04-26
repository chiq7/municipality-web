"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { facilities, STATUS_OPTIONS, getPrefectures } from "@/lib/data";
import StatusBadge from "@/components/StatusBadge";
import { FacilityPlaceholder } from "@/components/FacilityTypeIcon";
import type { NormalizedStatus } from "@/lib/types";

export default function HomePage() {
  const [status, setStatus] = useState<NormalizedStatus | "すべて">("すべて");
  const [prefecture, setPrefecture] = useState("すべて");
  const [query, setQuery] = useState("");

  const prefectures = useMemo(() => getPrefectures(), []);

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (status !== "すべて" && f.normalizedStatus !== status) return false;
      if (prefecture !== "すべて" && f.prefecture !== prefecture) return false;
      if (query) {
        const q = query.toLowerCase();
        const text = (f.facilityName + f.municipality + f.prefecture + f.keywords.join(" ")).toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [status, prefecture, query]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-gray-900">未利用公共施設バンク</h1>
            <span className="text-xs text-gray-500">{filtered.length}件表示中</span>
          </div>
          <p className="text-xs text-gray-500">
            このサイトは全国の未利用公共施設を格安で借りたい事業者向けの情報サービスです。掲載状態はPDF原文に基づきます。
          </p>
        </div>
      </header>

      {/* フィルター */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="施設名・地域・キーワードで検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NormalizedStatus | "すべて")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={prefecture}
            onChange={(e) => setPrefecture(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="すべて">すべての都道府県</option>
            {prefectures.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 一覧 */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p>条件に一致する施設が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((facility) => (
              <Link
                key={facility.id}
                href={`/facility/${facility.id}`}
                className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-300 transition-all"
              >
                {/* 写真 */}
                <div className="relative">
                  {facility.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={facility.photoUrl}
                      alt={facility.facilityName}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="h-40">
                      <FacilityPlaceholder type={facility.facilityType} />
                    </div>
                  )}
                </div>

                {/* カード本文 */}
                <div className="p-3 space-y-1.5">
                  {/* 施設名 */}
                  <h2 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
                    {facility.facilityName}
                  </h2>

                  {/* 都道府県・市区町村 */}
                  <p className="text-xs text-gray-500">
                    📍 {facility.prefecture} {facility.municipality}
                  </p>

                  {/* 施設タイプ */}
                  <p className="text-xs text-gray-500">
                    🏷 {facility.facilityType}
                  </p>

                  {/* 状態バッジ */}
                  <StatusBadge status={facility.normalizedStatus} size="sm" />

                  {/* 一言説明（抜粋1行） */}
                  <p className="text-xs text-gray-600 line-clamp-2 pt-0.5">
                    {facility.excerpt || "詳細はPDFをご確認ください"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
