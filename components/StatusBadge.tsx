import type { NormalizedStatus } from "@/lib/types";

const CONFIG: Record<NormalizedStatus, { label: string; bg: string; text: string; border: string }> = {
  "民間活用募集中": {
    label: "民間活用募集中",
    bg: "bg-red-100", text: "text-red-800", border: "border-red-200",
  },
  "廃止済・未利用": {
    label: "廃止済・未利用",
    bg: "bg-green-100", text: "text-green-800", border: "border-green-200",
  },
  "廃止予定": {
    label: "廃止予定",
    bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200",
  },
  "廃止検討中": {
    label: "廃止検討中（要確認）",
    bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200",
  },
  "休止中": {
    label: "休止中",
    bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200",
  },
  "活用済み": {
    label: "活用済み",
    bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200",
  },
  "要確認": {
    label: "要確認",
    bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200",
  },
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: NormalizedStatus;
  size?: "sm" | "md";
}) {
  const c = CONFIG[status] ?? CONFIG["要確認"];
  const sz = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-block rounded-full font-medium border ${sz} ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}
