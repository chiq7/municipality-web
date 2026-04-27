import { NextResponse } from "next/server";
import facilitiesRaw from "@/data/facilities.json";
import type { Facility } from "@/lib/types";
import { STATUS_OPTIONS } from "@/lib/data";

const facilities = facilitiesRaw as Facility[];

export async function GET() {
  const prefSet = new Set(facilities.map((f) => f.prefecture));
  const prefectures = Array.from(prefSet).sort();
  const total = facilities.length;

  return NextResponse.json(
    { prefectures, statusOptions: STATUS_OPTIONS, total },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
