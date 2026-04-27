import type { FacilityType } from "@/lib/types";

const ICONS: Record<FacilityType, { emoji: string; bg: string }> = {
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

export default function FacilityTypeIcon({ type, size = 40 }: { type: FacilityType; size?: number }) {
  const { emoji, bg } = ICONS[type] ?? ICONS["未分類"];
  return (
    <div
      className={`flex items-center justify-center rounded-xl select-none ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}

export function FacilityPlaceholder({ type }: { type: FacilityType }) {
  const { emoji, bg } = ICONS[type] ?? ICONS["未分類"];
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${bg}`}>
      <span style={{ fontSize: 64, lineHeight: 1 }}>{emoji}</span>
    </div>
  );
}
