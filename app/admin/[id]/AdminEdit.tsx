"use client";

// クライアントコンポーネント: 1件分のfacilityのみ受け取る（全件ロードしない）
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Facility } from "@/lib/types";

const STORAGE_KEY = "facility_overrides_v1";

function loadOverrides(): Record<string, Partial<Facility>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveOverride(id: string, data: Partial<Facility>) {
  const all = loadOverrides();
  all[id] = { ...all[id], ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

interface Props {
  facility: Facility;
}

type FormState = {
  exactAddress: string;
  area: string;
  buildYear: string;
  buildingStructure: string;
  annualCost: string;
  electricity: string;
  water: string;
  gas: string;
  photoUrl: string;
  department: string;
  contactEmail: string;
  lastVerifiedDate: string;
  verificationMethod: string;
};

export default function AdminEdit({ facility }: Props) {
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState<FormState>({
    exactAddress: "",
    area: "",
    buildYear: "",
    buildingStructure: "",
    annualCost: "",
    electricity: "",
    water: "",
    gas: "",
    photoUrl: "",
    department: "",
    contactEmail: "",
    lastVerifiedDate: "",
    verificationMethod: "",
  });

  useEffect(() => {
    const stored = loadOverrides()[facility.id] || {};
    setForm({
      exactAddress:      String(stored.exactAddress      ?? facility.exactAddress      ?? ""),
      area:              String(stored.area              ?? facility.area              ?? ""),
      buildYear:         String(stored.buildYear         ?? facility.buildYear         ?? ""),
      buildingStructure: String(stored.buildingStructure ?? facility.buildingStructure ?? ""),
      annualCost:        String(stored.annualCost        ?? facility.annualCost        ?? ""),
      electricity:       stored.electricity       ?? facility.electricity       ?? "",
      water:             stored.water             ?? facility.water             ?? "",
      gas:               stored.gas               ?? facility.gas               ?? "",
      photoUrl:          stored.photoUrl          ?? facility.photoUrl          ?? "",
      department:        stored.department        ?? facility.department        ?? "",
      contactEmail:      stored.contactEmail      ?? facility.contactEmail      ?? "",
      lastVerifiedDate:  stored.lastVerifiedDate  ?? facility.lastVerifiedDate  ?? "",
      verificationMethod: stored.verificationMethod ?? facility.verificationMethod ?? "",
    });
  }, [facility]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    const cleaned: Partial<Facility> = {};
    for (const [k, v] of Object.entries(form)) {
      (cleaned as Record<string, string | null>)[k] = (v as string).trim() || null;
    }
    saveOverride(facility.id, cleaned);
    setSaved(true);
  };

  // エクスポート: /api/export から全件取得 → localStorageの上書きをマージ → ダウンロード
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("export failed");
      const all: Facility[] = await res.json();
      const overrides = loadOverrides();
      const merged = all.map((f) => ({ ...f, ...overrides[f.id] }));
      const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facilities_updated_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("エクスポートに失敗しました。");
    } finally {
      setExporting(false);
    }
  };

  const fields: { key: keyof FormState; label: string; icon: string; type?: string }[] = [
    { key: "exactAddress",      label: "正確な住所",              icon: "📮" },
    { key: "area",              label: "面積（㎡）",              icon: "📐" },
    { key: "buildYear",         label: "築年数",                  icon: "🏗️" },
    { key: "buildingStructure", label: "建物構造（RC造/木造等）", icon: "🧱" },
    { key: "annualCost",        label: "年間維持管理費（円）",    icon: "💴" },
    { key: "electricity",       label: "電気",                    icon: "⚡", type: "select_infra" },
    { key: "water",             label: "水道",                    icon: "💧", type: "select_infra" },
    { key: "gas",               label: "ガス",                    icon: "🔥", type: "select_infra" },
    { key: "photoUrl",          label: "写真URL",                 icon: "📸" },
    { key: "department",        label: "担当部署名",              icon: "🏛️" },
    { key: "contactEmail",      label: "担当者メールアドレス",    icon: "📧", type: "email" },
    { key: "lastVerifiedDate",  label: "最終確認日（例: 2025-04-20）", icon: "📅" },
    { key: "verificationMethod", label: "確認方法（PDF/メール/電話）", icon: "📋" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link href={`/facility/${facility.id}`} className="text-sm text-blue-600 hover:underline">
          ← 詳細ページに戻る
        </Link>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h1 className="font-bold text-lg text-gray-900 mb-1">未取得情報の入力</h1>
          <p className="text-sm text-gray-600 mb-1">
            {facility.prefecture} {facility.municipality}｜{facility.facilityName}
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
            入力データはブラウザのlocalStorageに保存されます。
            「JSONエクスポート」で data/facilities.json の更新用ファイルをダウンロードできます。
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {fields.map(({ key, label, icon, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {icon} {label}
              </label>
              {type === "select_infra" ? (
                <select
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">未取得</option>
                  <option value="あり">あり</option>
                  <option value="なし">なし</option>
                  <option value="要確認">要確認</option>
                </select>
              ) : (
                <input
                  type={type || "text"}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="未取得"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {saved ? "✅ 保存済み" : "保存する"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {exporting ? "取得中..." : "📥 全データをJSONエクスポート"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
