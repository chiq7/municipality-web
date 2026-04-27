// このモジュールはサーバーコンポーネント・APIルートのみからimportしてください。
// クライアントコンポーネントからimportすると facilities.json が全件クライアントに送信されます。
import type { Facility, NormalizedStatus } from "./types";
import facilitiesRaw from "../data/facilities.json";

export const facilities: Facility[] = facilitiesRaw as Facility[];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((f) => f.id === id);
}

export function getPrefectures(): string[] {
  const set = new Set(facilities.map((f) => f.prefecture));
  return Array.from(set).sort();
}

export const STATUS_OPTIONS: { value: NormalizedStatus | "すべて"; label: string }[] = [
  { value: "すべて", label: "すべての状態" },
  { value: "民間活用募集中", label: "民間活用募集中（申込・交渉可）" },
  { value: "廃止済・未利用", label: "廃止済・未利用（PDF原文に明記）" },
  { value: "廃止予定", label: "廃止予定（PDF原文に明記）" },
  { value: "廃止検討中", label: "廃止検討中（PDF原文に明記）" },
  { value: "休止中", label: "休止中（PDF原文に明記）" },
  { value: "活用済み", label: "活用済み（参考事例）" },
  { value: "要確認", label: "要確認（判断が難しい場合）" },
];
