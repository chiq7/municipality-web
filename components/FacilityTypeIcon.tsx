import type { FacilityType } from "@/lib/types";

const ICONS: Record<FacilityType, string> = {
  "温泉施設":              "♨️",
  "廃校（旧学校）":        "🏫",
  "宿泊・観光施設":        "🏨",
  "体育館・スポーツ施設":  "🏟️",
  "公民館・集会施設":      "🏛️",
  "公園・レクリエーション施設": "🌳",
  "倉庫・ストレージ":      "🏗️",
  "庁舎・行政施設":        "🏢",
  "医療・福祉施設":        "🏥",
  "未分類":                "🏚️",
};

export default function FacilityTypeIcon({ type, size = 40 }: { type: FacilityType; size?: number }) {
  const emoji = ICONS[type] ?? "🏚️";
  return (
    <div
      className="flex items-center justify-center bg-gray-100 rounded-lg text-center select-none"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}

export function FacilityPlaceholder({ type }: { type: FacilityType }) {
  const emoji = ICONS[type] ?? "🏚️";
  return (
    <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400">
      <span style={{ fontSize: 56 }}>{emoji}</span>
      <span className="text-sm">写真未取得</span>
    </div>
  );
}
