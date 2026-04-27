"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StatusBadge from "@/components/StatusBadge";
import { FacilityPlaceholder } from "@/components/FacilityTypeIcon";
import FavoriteButton, { useFavorites } from "@/components/FavoriteButton";
import type { NormalizedStatus, FacilityType, Facility } from "@/lib/types";

const JapanMap = dynamic(() => import("@/components/JapanMap"), { ssr: false });

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
  facilityCounts: Record<string, number>;
}

// Tag filter definitions
type TagFilter = {
  label: string;
  facilityType?: FacilityType;
  keyword?: string;
};

const TAG_FILTERS: TagFilter[] = [
  { label: "すべて" },
  { label: "廃校",      facilityType: "廃校（旧学校）" },
  { label: "温泉",      facilityType: "温泉施設" },
  { label: "キャンプ場向き", keyword: "キャンプ" },
  { label: "サバゲー向き",  keyword: "サバゲー" },
  { label: "ヤード向き",    facilityType: "倉庫・ストレージ" },
  { label: "宿泊施設",  facilityType: "宿泊・観光施設" },
  { label: "スポーツ施設", facilityType: "体育館・スポーツ施設" },
  { label: "山近",      keyword: "山" },
  { label: "海近",      keyword: "海" },
  { label: "川近",      keyword: "川" },
];

export default function FacilityList({ prefectures, statusOptions, facilityCounts }: Props) {
  const [status,      setStatus]      = useState<NormalizedStatus | "すべて">("すべて");
  const [prefecture,  setPrefecture]  = useState("");
  const [query,       setQuery]       = useState("");
  const [activeTag,   setActiveTag]   = useState("すべて");
  const [page,        setPage]        = useState(1);
  const [data,        setData]        = useState<ApiResponse | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showMap,     setShowMap]     = useState(false);
  const [favOnly,     setFavOnly]     = useState(false);

  const { favorites, toggle } = useFavorites();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (status !== "すべて") params.set("status", status);
      if (prefecture) params.set("prefecture", prefecture);
      if (debouncedQuery) params.set("query", debouncedQuery);

      const tag = TAG_FILTERS.find((t) => t.label === activeTag);
      if (tag && activeTag !== "すべて") {
        if (tag.facilityType) params.set("facilityType", tag.facilityType);
        if (tag.keyword) params.set("query", (debouncedQuery ? debouncedQuery + " " : "") + tag.keyword);
      }

      if (favOnly) {
        params.set("favorites", "1");
        params.set("favIds", Array.from(favorites).join(","));
      }

      const res = await fetch(`/api/facilities?${params}`);
      if (res.status === 429) {
        setError("リクエストが多すぎます。少し待ってから再試行してください。");
        return;
      }
      if (!res.ok) throw new Error("取得エラー");
      setData(await res.json());
    } catch {
      setError("データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [status, prefecture, debouncedQuery, activeTag, favOnly, favorites]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [status, prefecture, debouncedQuery, activeTag, favOnly, fetchData]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    setFavOnly(false);
  };

  const facilities = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">未利用公共施設バンク</h1>
            <p className="text-xs text-gray-500 hidden sm:block">全国の空き公共施設を格安で活用しよう</p>
          </div>
          {meta && (
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600">{meta.total.toLocaleString()}<span className="text-xs text-gray-500 font-normal ml-1">件表示中</span></p>
            </div>
          )}
        </div>
      </header>

      {/* フィルターUI */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          {/* 検索 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="施設名・地域・キーワードで検索..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NormalizedStatus | "すべて")}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* タグフィルター */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TAG_FILTERS.map((tag) => (
              <button
                key={tag.label}
                onClick={() => handleTagChange(tag.label)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeTag === tag.label
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {tag.label}
              </button>
            ))}
            <button
              onClick={() => { setFavOnly(!favOnly); setActiveTag("すべて"); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                favOnly
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-500"
              }`}
            >
              ♥ お気に入り{favorites.size > 0 && ` (${favorites.size})`}
            </button>
          </div>

          {/* 地図で絞り込む */}
          <div>
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              🗾 地図で都道府県を絞り込む {showMap ? "▲" : "▼"}
              {prefecture && <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{prefecture} ×</span>}
            </button>
            {showMap && (
              <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <JapanMap
                  selected={prefecture}
                  onSelect={(p) => { setPrefecture(p); if (p) setShowMap(false); }}
                  facilityCounts={facilityCounts}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* カード一覧 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-36 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-medium">条件に一致する施設が見つかりませんでした</p>
            <button onClick={() => { setQuery(""); setActiveTag("すべて"); setStatus("すべて"); setPrefecture(""); setFavOnly(false); }}
              className="mt-4 text-sm text-blue-600 hover:underline">
              フィルターをリセット
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {facilities.map((facility) => (
                <div key={facility.id} className="relative group">
                  <Link
                    href={`/facility/${facility.id}`}
                    className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
                  >
                    {/* 施設タイプアイコン */}
                    <div className="h-36 relative overflow-hidden">
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

                    <div className="p-3">
                      <h2 className="font-bold text-sm text-gray-900 leading-snug mb-1 line-clamp-2 min-h-[2.5rem]">
                        {facility.facilityName}
                      </h2>
                      <p className="text-xs text-gray-500 mb-2">
                        📍 {facility.prefecture} {facility.municipality}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <StatusBadge status={facility.normalizedStatus} size="sm" />
                        {facility.tags?.includes("条件付き利用可") && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            ⚠️ 条件付き
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-1">
                        💰 賃料目安：<span className="text-gray-400">調査中</span>
                      </p>

                      <p className="text-xs text-gray-600 line-clamp-1">
                        {facility.excerpt || "詳細はPDFをご確認ください"}
                      </p>
                    </div>
                  </Link>

                  {/* お気に入りボタン（カード右上） */}
                  <div className="absolute top-2 right-2">
                    <FavoriteButton
                      id={facility.id}
                      favorites={favorites}
                      onToggle={toggle}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ページネーション */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← 前へ
                </button>

                {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                  let p: number;
                  const half = 3;
                  if (meta.totalPages <= 7) p = i + 1;
                  else if (meta.page <= half + 1) p = i + 1;
                  else if (meta.page >= meta.totalPages - half) p = meta.totalPages - 6 + i;
                  else p = meta.page - half + i;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`px-3 py-1.5 text-sm border rounded-xl transition-colors ${
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
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  次へ →
                </button>

                <span className="text-xs text-gray-500 ml-2">
                  {meta.page} / {meta.totalPages}ページ
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
