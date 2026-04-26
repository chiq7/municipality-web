import { notFound } from "next/navigation";
import Link from "next/link";
import { getFacilityById, facilities } from "@/lib/data";
import { getApplicableSubsidies } from "@/lib/subsidies";
import StatusBadge from "@/components/StatusBadge";
import { FacilityPlaceholder } from "@/components/FacilityTypeIcon";
import InfoRow from "@/components/InfoRow";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="font-bold text-base text-gray-900 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </section>
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

  const mailSubject = encodeURIComponent(`${f.municipality} ${f.facilityName}に関するお問い合わせ`);
  const mailBody = encodeURIComponent(
    `${f.municipality} ご担当者様\n\n空き施設バンク運営事務局です。\n御市の「${f.facilityName}」施設について、以下の情報をご提供いただけますでしょうか。\n\n・正確な住所\n・面積（㎡）\n・築年数\n・現在の担当部署・連絡先\n・施設の写真\n・最新の活用方針\n\nお忙しいところ恐れ入りますが、よろしくお願いいたします。\n\n空き施設バンク運営事務局`
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ナビゲーション */}
      <div className="max-w-3xl mx-auto px-4 py-3">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 一覧に戻る
        </Link>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12 space-y-4">

        {/* ① 施設基本情報 */}
        <Section title="① 施設基本情報">
          {/* 写真エリア */}
          <div className="mb-4">
            {f.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={f.photoUrl}
                alt={f.facilityName}
                className="w-full h-56 object-cover rounded-lg"
              />
            ) : (
              <FacilityPlaceholder type={f.facilityType} />
            )}
          </div>

          {/* 施設名 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">
            {f.facilityName}
          </h1>

          {/* 都道府県・市区町村 */}
          <p className="text-sm text-gray-600 mb-3">
            📍 {f.prefecture} {f.municipality}
          </p>

          {/* タイプ・状態 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-block text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
              🏷 {f.facilityType}
            </span>
            <StatusBadge status={f.normalizedStatus} />
          </div>

          {/* PDF上の表記（原文） */}
          {f.rawStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">PDF上の状態表記（原文）</p>
              <p className="text-sm text-gray-800 font-medium">{f.rawStatus}</p>
            </div>
          )}

          {/* 情報出典 */}
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 space-y-0.5">
            <p>
              <span className="font-medium">情報出典：</span>
              {f.municipality} 公共施設等総合管理計画
            </p>
            <p>
              <span className="font-medium">取得日：</span>
              {f.dataAcquiredDate}
            </p>
            <p className="text-blue-600">※最新情報は自治体にご確認ください</p>
          </div>
        </Section>

        {/* ② 法規制・リスク情報 */}
        <Section title="② 法規制・リスク情報">
          <p className="text-xs text-gray-500 mb-3">
            以下の情報はPDF資料に記載がある場合のみ掲載しています。
          </p>
          <InfoRow icon="⚠️" label="ハザードリスク" value={null} />
          <InfoRow icon="🏙️" label="区域制限（市街化調整区域等）" value={null} />
          <InfoRow
            icon="🏷️"
            label="施設タイプ（確認済み）"
            value={f.facilityType !== "未分類" ? f.facilityType : null}
          />
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded p-2">
            上記「未取得」の項目は自治体への問い合わせで確認が必要です。
          </p>
        </Section>

        {/* ③ PDFから読み取れた情報（原文のみ・AI要約なし） */}
        <Section title="③ PDFから読み取れた情報">
          <p className="text-xs text-gray-500 mb-3">
            以下はPDFから抽出した原文テキストです。AIによる要約・解釈は行っていません。
          </p>

          {/* 検出キーワード（原文） */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">検出キーワード（PDF原文）</p>
            <div className="flex flex-wrap gap-1.5">
              {f.keywords.length > 0 ? (
                f.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                  >
                    {kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">キーワードなし</span>
              )}
            </div>
          </div>

          {/* 抜粋（PDF原文そのまま・AI要約禁止） */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              該当箇所の抜粋
              <span className="ml-1 text-gray-400">（PDF原文そのまま。ユーザーご自身でご判断ください）</span>
            </p>
            {f.excerpt ? (
              <blockquote className="text-sm text-gray-800 bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400 leading-relaxed whitespace-pre-wrap">
                {f.excerpt}
              </blockquote>
            ) : (
              <p className="text-sm text-gray-400 italic">抜粋なし</p>
            )}
          </div>

          {/* 出典・取得日 */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">出典PDF</span>
              <a
                href={f.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                元資料PDFを見る →
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">データ取得日</span>
              <span className="text-xs text-gray-700">{f.dataAcquiredDate}</span>
            </div>
          </div>
        </Section>

        {/* ④ 使える可能性がある補助金（公式情報に基づくもののみ） */}
        <Section title="④ 使える可能性がある補助金">
          {subsidies.length === 0 ? (
            <p className="text-sm text-gray-500">
              現時点でPDF・公式情報に基づく該当補助金は確認されていません。
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
                以下は公式情報に基づく補助金です。各省庁の最新情報を必ずご確認ください。
                出典リンクを必ずご確認ください。
              </p>
              {subsidies.map((s, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900">{s.name}</p>
                    <span className="text-xs text-gray-500 shrink-0">{s.ministry}</span>
                  </div>
                  <p className="text-xs text-gray-600">{s.description}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    公式サイトで確認する（出典） →
                  </a>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ⑤ 活用ポテンシャル（非表示・将来用） */}
        {/* DBフィールド: f.activationPotential, f.activationNotes */}

        {/* 未取得情報 */}
        <Section title="未取得情報（詳細データ）">
          <InfoRow icon="📮" label="正確な住所" value={f.exactAddress} />
          <InfoRow icon="📐" label="面積（㎡）" value={f.area} />
          <InfoRow icon="🏗️" label="築年数" value={f.buildYear} />
          <InfoRow icon="⚡" label="電気" value={f.electricity} />
          <InfoRow icon="💧" label="水道" value={f.water} />
          <InfoRow icon="🔥" label="ガス" value={f.gas} />
          <InfoRow icon="📸" label="写真URL" value={f.photoUrl} />
          <InfoRow icon="🏛️" label="担当部署" value={f.department} />
          <InfoRow icon="📧" label="担当者メールアドレス" value={f.contactEmail} />
          <InfoRow icon="📅" label="最終確認日" value={f.lastVerifiedDate} />
          <InfoRow icon="📋" label="確認方法" value={f.verificationMethod} />
          <div className="mt-3">
            <Link href={`/admin/${f.id}`} className="text-xs text-blue-600 hover:underline">
              ✏️ 未取得情報を入力する（管理者用）
            </Link>
          </div>
        </Section>

        {/* ⑥ 自治体への問い合わせ */}
        <Section title="⑥ 自治体への問い合わせ">
          <div className="space-y-3">
            {f.municipalityUrl && (
              <a
                href={f.municipalityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🌐 自治体公式サイトへ
              </a>
            )}
            <a
              href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              ✉️ 詳細情報を問い合わせる（メールテンプレート）
            </a>
            <p className="text-xs text-gray-500 text-center">
              メールクライアントが開きます。担当者のアドレスを手動で入力してください。
            </p>
          </div>
        </Section>

      </main>
    </div>
  );
}
