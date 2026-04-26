import type { Facility, NormalizedStatus } from "./types";
import facilitiesRaw from "../data/facilities.json";

export const facilities: Facility[] = facilitiesRaw as Facility[];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((f) => f.id === id);
}

export function filterFacilities(params: {
  status?: NormalizedStatus | "すべて";
  prefecture?: string;
  query?: string;
}): Facility[] {
  return facilities.filter((f) => {
    if (params.status && params.status !== "すべて") {
      if (f.normalizedStatus !== params.status) return false;
    }
    if (params.prefecture && params.prefecture !== "すべて") {
      if (f.prefecture !== params.prefecture) return false;
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      const text = (f.facilityName + f.municipality + f.prefecture + f.keywords.join(" ")).toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

export function getPrefectures(): string[] {
  const set = new Set(facilities.map((f) => f.prefecture));
  return Array.from(set).sort();
}

export const STATUS_OPTIONS: { value: NormalizedStatus | "すべて"; label: string }[] = [
  { value: "すべて", label: "すべての状態" },
  { value: "売却・貸付募集中", label: "売却・貸付募集中（今すぐ申込可）" },
  { value: "廃止済・未利用", label: "廃止済・未利用（交渉可能）" },
  { value: "廃止予定", label: "廃止予定（将来取得可）" },
  { value: "休止中", label: "休止中（交渉次第）" },
  { value: "廃止済・活用中", label: "廃止済・活用中（参考事例）" },
  { value: "その他", label: "その他" },
];
