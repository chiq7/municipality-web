import type { NormalizedStatus } from "@/lib/types";

const CONFIG: Record<NormalizedStatus, { label: string; bg: string; text: string }> = {
  "売却・貸付募集中": { label: "売却・貸付募集中", bg: "bg-red-100", text: "text-red-800" },
  "廃止済・未利用":   { label: "廃止済・未利用",   bg: "bg-green-100", text: "text-green-800" },
  "廃止予定":         { label: "廃止予定",         bg: "bg-orange-100", text: "text-orange-800" },
  "休止中":           { label: "休止中",           bg: "bg-yellow-100", text: "text-yellow-800" },
  "廃止済・活用中":   { label: "廃止済・活用中",   bg: "bg-blue-100", text: "text-blue-800" },
  "その他":           { label: "その他",           bg: "bg-gray-100", text: "text-gray-600" },
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: NormalizedStatus;
  size?: "sm" | "md";
}) {
  const c = CONFIG[status] ?? CONFIG["その他"];
  const sz = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span className={`inline-block rounded-full font-medium ${sz} ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
