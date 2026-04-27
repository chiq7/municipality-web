import { notFound } from "next/navigation";
import Link from "next/link";
import { getFacilityById, facilities } from "@/lib/data";
import { getApplicableSubsidies } from "@/lib/subsidies";
import StatusBadge from "@/components/StatusBadge";
import { FacilityPlaceholder } from "@/components/FacilityTypeIcon";
import type { FacilityType } from "@/lib/types";

export async function generateStaticParams() {
  return facilities.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = getFacilityById(id);
  if (!f) return { title: "施設が見つかりません" };
  return {
    title: `${f.facilityName} | ${f.prefecture}${f.municipality} | 未利用公共施設バンク`,
    description: f.excerpt?.slice(0, 120) || `${f.prefecture}${f.municipality}の${f.facilityType}`,
  };
}

const TYPE_ICONS: Record<FacilityType, { emoji: string; bg: string }> = {
  "温泉施設":                   { emoji: "♨️",  bg: "bg-red-50" },
  "廃校（旧学校）":             { emoji: "🏫",  bg: "bg-blue-50" },
  "宿泊・観光施設":             { emoji: "🏨",  bg: "bg-teal-50" },
  "体育館・スポーツ施設":       { emoji: "🏟️", bg: "bg-green-50" },
  "公民館・集会施設":           { emoji: "🏛️", bg: "bg-purple-50" },
  "公園・レクリエーション施設": { emoji: "🌳",  bg: "bg-emerald-50" },
  "倉庫・ストレージ":           { emoji: "🏗️", bg: "bg-gray-50" },
  "庁舎・行政施設":             { emoji: "🏢",  bg: "bg-slate-50" },
  "医療・福祉施設":             { emoji: "🏥",  bg: "bg-pink-50" },
  "未分類":                     { emoji: "🏚️", bg: "bg-gray-50" },
};

function InfoGrid({ items }: { items: { icon: string; label: string; value: string | null | number | undefined }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(({ icon, label, value }) => (
        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl mb-1">{icon}</p>
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className={`text-sm font-semibold ${value != null ? "text-gray-900" : "text-gray-400"}`}>
            {value != null ? String(value) : "未取得"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const f = getFacilityById(id);
  if (!f) notFound();

  const subsidies = getApplicableSubsidies(f);
  const typeIcon = TYPE_ICONS[f.facilityType] ?? TYPE_ICONS["未分類"];

  const mailSubject = encodeURIComponent(`${f.municipality} ${f.facilityName}に関するお問い合わせ`);
  const mailBody = encodeURIComponent(
    `${f.municipality} ご担当者様\n\n空き施設バンク運営事務局です。\n御市の「${f.facilityName}」施設について、以下の情報をご提供いただけますでしょうか。\n\n・正確な住所\n・面積（㎡）\n・築年数\n・現在の担当部署・連絡先\n・施設の写真\n・最新の活用方針\n\nお忙しいところ恐れ入りますが、よろしくお願いいたします。\n\n空き施設バンク運営事務局`
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <Link href="/" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
          ← 一覧に戻る
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12 space-y-4">

        {/* ① ヘッダーカード */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* 写真 or アイコン */}
          <div className="h-52 relative">
            {f.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photoUrl} alt={f.facilityName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center ${typeIcon.bg}`}>
                <span style={{ fontSize: 80, lineHeight: 1 }}>{typeIcon.emoji}</span>
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={f.normalizedStatus} />
              {f.tags?.includes("条件付き利用可") && (
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full border border-orange-200 font-medium">
                  ⚠️ 条件付き利用可
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-snug">{f.facilityName}</h1>
            <p className="text-sm text-gray-500 mb-3">📍 {f.prefecture} {f.municipality}</p>

            {f.rawStatus && (
              <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600">
                PDF原文：「{f.rawStatus}」
              </div>
            )}
          </div>
        </div>

        {/* ② 施設スペック */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-base text-gray-900 mb-4">施設スペック</h2>
          <InfoGrid items={[
            { icon: "📐", label: "面積",   value: f.area != null ? `${f.area}㎡` : null },
            { icon: "📅", label: "築年",   value: f.buildYear != null ? `${f.buildYear}年` : null },
            { icon: "🏗️", label: "構造",  value: f.buildingStructure },
            { icon: "⚡", label: "電気",   value: f.electricity },
            { icon: "💧", label: "水道",   value: f.water },
            { icon: "🔥", label: "ガス",   value: f.gas },
            { icon: "⚠️", label: "ハザード", value: null },
            { icon: "🗺️", label: "調整区域", value: null },
          ]} />

          {f.annualCost != null && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">年間維持管理費（PDF記載）</p>
              <p className="text-lg font-bold text-amber-900">{f.annualCost.toLocaleString()}円/年</p>
            </div>
          )}
        </div>

        {/* ③ 賃料目安 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-base text-gray-900 mb-3">💰 賃料目安（土地のみ）</h2>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-gray-300">調査中</p>
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            ※住所取得後に路線価より自動計算予定<br />
            建物使用・宿泊・商業利用の場合は別途加算<br />
            実際の金額は自治体との交渉により異なります
          </p>
        </div>

        {/* ④ 住所 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-base text-gray-900 mb-3">📮 所在地</h2>
          {f.exactAddress ? (
            <p className="text-sm text-gray-900 font-medium">{f.exactAddress}</p>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">住所未取得</p>
              <p className="text-sm text-gray-600">
                「{f.facilityName}」{f.municipality} で検索してください
              </p>
            </div>
          )}
          {f.department && (
            <p className="text-xs text-gray-500 mt-2">担当部署：{f.department}</p>
          )}
        </div>

        {/* ⑤ PDF原文 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-base text-gray-900 mb-3">📄 PDF原文情報</h2>

          {f.keywords.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">検出キーワード</p>
              <div className="flex flex-wrap gap-1">
                {f.keywords.map((kw, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {f.excerpt && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">抜粋（PDF原文）</p>
              <blockquote className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border-l-4 border-gray-300 leading-relaxed whitespace-pre-wrap">
                {f.excerpt}
              </blockquote>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">{f.municipality} 公共施設等総合管理計画 | {f.dataAcquiredDate}</span>
            <a
              href={f.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              元資料PDF →
            </a>
          </div>
        </div>

        {/* ⑥ 補助金 */}
        {subsidies.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-base text-gray-900 mb-3">🎁 使える可能性がある補助金</h2>
            <div className="space-y-3">
              {subsidies.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{s.ministry}</p>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-blue-600 hover:underline"
                  >
                    詳細 →
                  </a>
                </div>
              ))}
              <p className="text-xs text-gray-400">※適用条件は要確認。各省庁公式サイトでご確認ください。</p>
            </div>
          </div>
        )}

        {/* ⑦ 問い合わせ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-base text-gray-900 mb-4">📞 問い合わせ</h2>
          <div className="space-y-3">
            <a
              href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors"
            >
              ✉️ 自治体に問い合わせる
            </a>
            {f.municipalityUrl && (
              <a
                href={f.municipalityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🌐 自治体公式サイト
              </a>
            )}
            <Link
              href={`/?prefecture=${encodeURIComponent(f.prefecture)}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📍 同じ都道府県の施設を見る
            </Link>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            メールクライアントが開きます。担当者アドレスを手動で入力してください。
          </p>
        </div>

        {/* 管理者リンク */}
        <div className="text-center">
          <Link href={`/admin/${f.id}`} className="text-xs text-gray-400 hover:underline">
            ✏️ 未取得情報を入力する（管理者用）
          </Link>
        </div>

      </main>
    </div>
  );
}
