import type { NormalizedStatus } from "@/lib/types";

const CONFIG: Record<NormalizedStatus, { label: string; bg: string; text: string; dot: string }> = {
  "民間活用募集中": {
    label: "民間活用募集中",
    bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500",
  },
  "廃止予定": {
    label: "廃止予定",
    bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500",
  },
  "廃止済・未利用": {
    label: "廃止済・未利用",
    bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500",
  },
  "廃止検討中": {
    label: "廃止検討中",
    bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500",
  },
  "休止中": {
    label: "休止中",
    bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500",
  },
  "活用済み": {
    label: "活用済み",
    bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400",
  },
  "要確認": {
    label: "要確認",
    bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400",
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
  const sz = size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-3 py-1 gap-1.5";
  const dotSz = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sz} ${c.bg} ${c.text}`}>
      <span className={`rounded-full shrink-0 ${dotSz} ${c.dot}`} />
      {c.label}
    </span>
  );
}
