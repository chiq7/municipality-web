"use client";

// クライアントコンポーネント: /api/facilities からページ単位でデータ取得
// facilities.json を直接importしないことで全件クライアント送信を防止

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { FacilityPlaceholder } from "@/components/FacilityTypeIcon";
import type { NormalizedStatus, Facility } from "@/lib/types";

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse {
  data: Omit<Facility, "treasureScore" | "scoreReason">[];
  meta: Meta;
}

interface Props {
  prefectures: string[];
  statusOptions: { value: NormalizedStatus | "すべて"; label: string }[];
}

export default function FacilityList({ prefectures, statusOptions }: Props) {
  const [status, setStatus]       = useState<NormalizedStatus | "すべて">("すべて");
  const [prefecture, setPrefecture] = useState("すべて");
  const [query, setQuery]         = useState("");
  const [page, setPage]           = useState(1);
  const [data, setData]           = useState<ApiResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (status !== "すべて") params.set("status", status);
      if (prefecture !== "すべて") params.set("prefecture", prefecture);
      if (query) params.set("query", query);

      const res = await fetch(`/api/facilities?${params}`);
      if (res.status === 429) {
        setError("リクエストが多すぎます。1分後に再試行してください。");
        return;
      }
      if (!res.ok) throw new Error("取得エラー");
      setData(await res.json());
    } catch {
      setError("データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [status, prefecture, query]);

  // フィルター変更時はページ1に戻してfetch
  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [status, prefecture, query, fetchData]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const facilities = data?.data ?? [];
  const meta       = data?.meta;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-gray-900">未利用公共施設バンク</h1>
            {meta && (
              <span className="text-xs text-gray-500">
                {meta.total.toLocaleString()}件中 {((meta.page - 1) * meta.pageSize) + 1}–
                {Math.min(meta.page * meta.pageSize, meta.total)}件表示
              </span>
            )}
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
            {statusOptions.map((opt) => (
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3 animate-pulse">🔄</p>
            <p className="text-sm">読み込み中...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p>条件に一致する施設が見つかりませんでした</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility) => (
                <Link
                  key={facility.id}
                  href={`/facility/${facility.id}`}
                  className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="h-40">
                    {facility.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={facility.photoUrl}
                        alt={facility.facilityName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FacilityPlaceholder type={facility.facilityType} />
                    )}
                  </div>

                  <div className="p-3 space-y-1.5">
                    <h2 className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
                      {facility.facilityName}
                    </h2>
                    <p className="text-xs text-gray-500">
                      📍 {facility.prefecture} {facility.municipality}
                    </p>
                    <p className="text-xs text-gray-500">🏷 {facility.facilityType}</p>
                    <StatusBadge status={facility.normalizedStatus} size="sm" />
                    <p className="text-xs text-gray-600 line-clamp-2 pt-0.5">
                      {facility.excerpt || "詳細はPDFをご確認ください"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ページネーション */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← 前へ
                </button>

                {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                  // 現在ページ周辺のページ番号を表示
                  let p: number;
                  const half = 3;
                  if (meta.totalPages <= 7) {
                    p = i + 1;
                  } else if (meta.page <= half + 1) {
                    p = i + 1;
                  } else if (meta.page >= meta.totalPages - half) {
                    p = meta.totalPages - 6 + i;
                  } else {
                    p = meta.page - half + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                        p === meta.page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page === meta.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  次へ →
                </button>

                <span className="text-xs text-gray-500 ml-2">
                  {meta.page} / {meta.totalPages}ページ（1ページ{meta.pageSize}件）
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
