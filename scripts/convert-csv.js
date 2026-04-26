// Convert results.csv → data/facilities.json
// Run: node scripts/convert-csv.js
const fs = require("fs");
const path = require("path");

// Simple but correct CSV parser that handles quoted fields with embedded newlines
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Remove BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else if (ch === "\r" && text[i + 1] === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i += 2;
      } else if (ch === "\r") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some((f) => f.trim())) rows.push(row);
  }
  return rows;
}

// ステータス正規化（PDF原文テキストも参照して10パターンを判定）
function normalizeStatus(raw, keywords, excerpt) {
  const s = (raw || "").trim();
  const kw = (keywords || "").toLowerCase();
  const ex = (excerpt || "").toLowerCase();
  const full = s.toLowerCase() + " " + kw + " " + ex;

  if (!s) return "要確認";

  // ── パターン6: 指定管理 → 活用済み（民間が既に運営中） ──
  if (
    s.includes("指定管理") ||
    s.includes("指定管理者") ||
    s.includes("指定管理制度")
  )
    return "活用済み";

  // ── パターン9: カフェ・店舗が既に営業中 → 活用済み ──
  // ── パターン7: 事業者決定済み・採択 → 活用済み（参考事例） ──
  if (
    full.includes("事業者決定") ||
    full.includes("採択済") ||
    (s.includes("廃止済") && (s.includes("活用中") || s.includes("賃貸") || s.includes("地域交流"))) ||
    (s.includes("廃校") && (s.includes("活用中") || s.includes("賃貸活用"))) ||
    s === "廃止済（転用検討中）" ||
    s.includes("廃止済み・跡地活用")
  )
    return "活用済み";

  // ── 運営中・稼働中・営業中 = 現役施設 → 活用済み ──
  if (
    s === "運営中" || s.startsWith("運営中（") ||
    s === "稼働中" || s.startsWith("稼働中（") ||
    s === "営業中" || s.startsWith("営業中（") ||
    s === "供用中" ||
    s === "運営中（直営）" ||
    s.includes("指定管理者による運営") ||
    s.includes("指定管理者制度で運営")
  )
    return "活用済み";

  // ── パターン3: 長寿命化改修対象 → 要確認（継続利用予定） ──
  if (s.includes("長寿命化") || kw.includes("長寿命化"))
    return "要確認";

  // ── パターン4: 予防保全 → 要確認（修繕計画あり = 使い続ける） ──
  if (s.includes("予防保全") || kw.includes("予防保全"))
    return "要確認";

  // ── パターン5: 修繕ロードマップある施設 → 要確認（廃止と矛盾） ──
  if (
    s.includes("大規模改修") || s.includes("大規模修繕") ||
    s.includes("建替") || s.includes("建て替え") ||
    s.includes("建替え") || s.includes("修繕計画")
  )
    return "要確認";

  // ── パターン8: 公募型プロポーザル → 要確認（事業者決定済みの可能性） ──
  if (full.includes("プロポーザル") || full.includes("公募型"))
    return "要確認";

  // ── 廃止済・未利用（PDF原文に明記） ──
  if (
    s.includes("廃止済み・未利用") ||
    s.includes("廃止・未利用") ||
    s.includes("廃校・未利用") ||
    s === "廃止済み" ||
    s === "廃止済" ||
    s === "廃止" ||
    s === "廃止・売却" ||
    s === "廃止・譲与" ||
    s === "廃止・返還" ||
    s === "廃止・解体予定" ||
    s === "廃校" ||
    s === "廃校施設" ||
    s === "廃校（未利用施設）" ||
    s === "廃校済み。貸付・売却検討中、活用が見込めない施設は除却予定"
  )
    return "廃止済・未利用";

  // ── 廃止予定（PDF原文に明記） ──
  if (
    s.includes("廃止予定") ||
    s.includes("廃校予定") ||
    (s.includes("廃止") && s.includes("予定") && !s.includes("廃止済"))
  )
    return "廃止予定";

  // ── パターン1: 廃止検討中（まだ廃止されていない可能性） ──
  if (
    s.includes("廃止検討中") ||
    s.includes("廃止検討対象") ||
    (s.includes("廃止") && s.includes("検討") && !s.includes("廃止済"))
  )
    return "廃止検討中";

  // ── パターン10: 廃止 + 民間活用・維持管理費削減目的 → 民間活用募集中 ──
  if (
    (s.includes("廃止") || s.includes("廃校") || s.includes("未利用")) &&
    (full.includes("民間活用") || full.includes("サウンディング") || full.includes("利活用提案") || full.includes("民間譲渡"))
  )
    return "民間活用募集中";

  // ── 売却・貸付 → 民間活用募集中 ──
  if (
    s.includes("売却検討") ||
    s.includes("売却・無償譲渡") ||
    s.includes("売却又は用途廃止") ||
    s.includes("サウンディング") ||
    (s.includes("売却") && !s.includes("売却済")) ||
    (s.includes("貸付") && (s.includes("募集") || s.includes("検討") || s.includes("予定"))) ||
    s.includes("無償譲渡検討")
  )
    return "民間活用募集中";

  // ── パターン2: 用途廃止 → 要確認（施設全体廃止ではない可能性） ──
  if (s.includes("用途廃止") && !s.includes("廃止済") && !s.includes("未利用"))
    return "要確認";

  // ── 休止中（PDF原文に明記） ──
  if (s.includes("休止中")) return "休止中";

  // ── 上記以外 → 要確認 ──
  return "要確認";
}

function detectFacilityType(keywords, facilityName) {
  const text = (keywords + " " + facilityName).toLowerCase();
  if (text.includes("温泉")) return "温泉施設";
  if (text.includes("廃校") || text.includes("旧小学") || text.includes("旧中学") || text.includes("旧高校")) return "廃校（旧学校）";
  if (text.includes("キャンプ") || text.includes("宿泊") || text.includes("自然の家") || text.includes("研修センター") || text.includes("ロッヂ") || text.includes("ログハウス")) return "宿泊・観光施設";
  if (text.includes("湖畔") || text.includes("景観") || text.includes("観光")) return "宿泊・観光施設";
  if (text.includes("グラウンド") || text.includes("運動場") || text.includes("スポーツ") || text.includes("体育館")) return "体育館・スポーツ施設";
  if (text.includes("公民館") || text.includes("集会") || text.includes("コミュニティ")) return "公民館・集会施設";
  if (text.includes("公園") || text.includes("レクリエーション") || text.includes("レストハウス")) return "公園・レクリエーション施設";
  if (text.includes("倉庫") || text.includes("ストレージ") || text.includes("資材")) return "倉庫・ストレージ";
  if (text.includes("庁舎") || text.includes("役場") || text.includes("行政")) return "庁舎・行政施設";
  if (text.includes("医療") || text.includes("病院") || text.includes("診療") || text.includes("福祉") || text.includes("保健")) return "医療・福祉施設";
  return "未分類";
}

function getMunicipalityUrl(pdfUrl) {
  try {
    const url = new URL(pdfUrl);
    return url.origin;
  } catch {
    return null;
  }
}

const csvPath = path.join(__dirname, "../../municipality-pipeline/results.csv");
const outPath = path.join(__dirname, "../data/facilities.json");

const raw = fs.readFileSync(csvPath, "utf-8");
const rows = parseCSV(raw);
const [headers, ...dataRows] = rows;

console.log("Headers:", headers);
console.log("Total rows:", dataRows.length);

const facilities = [];
let id = 1;

for (const row of dataRows) {
  if (row.length < 7) continue;
  const prefecture = (row[0] || "").trim();
  const municipality = (row[1] || "").trim();
  const pdfUrl = (row[2] || "").trim();
  const facilityName = (row[3] || "").trim();
  const rawStatus = (row[4] || "").trim();
  const keywords = (row[5] || "").trim();
  const excerpt = (row[6] || "").trim().replace(/\n/g, " ");
  const treasureScore = parseInt(row[7] || "0", 10) || 0;
  const scoreReason = (row[8] || "").trim();

  if (!facilityName || !prefecture) continue;

  const normalizedStatus = normalizeStatus(rawStatus, keywords, excerpt);
  const facilityType = detectFacilityType(keywords, facilityName);
  const municipalityUrl = getMunicipalityUrl(pdfUrl);
  const keywordList = keywords
    .split(/[、,]/)
    .map((k) => k.trim())
    .filter(Boolean);

  facilities.push({
    id: String(id++).padStart(4, "0"),
    prefecture,
    municipality,
    pdfUrl,
    municipalityUrl,
    facilityName,
    rawStatus,
    normalizedStatus,
    keywords: keywordList,
    excerpt,
    treasureScore,
    scoreReason,
    facilityType,
    dataAcquiredDate: "2025年4月",
    // 未取得フィールド（後から入力）
    exactAddress: null,
    area: null,
    buildYear: null,
    electricity: null,
    water: null,
    gas: null,
    photoUrl: null,
    department: null,
    contactEmail: null,
    lastVerifiedDate: null,
    verificationMethod: null,
    // 将来用フィールド（現在非表示）
    activationPotential: null,
    activationNotes: null,
  });
}

fs.writeFileSync(outPath, JSON.stringify(facilities, null, 2), "utf-8");
console.log(`✅ ${facilities.length} facilities → data/facilities.json`);

// Status breakdown
const breakdown = {};
for (const f of facilities) {
  breakdown[f.normalizedStatus] = (breakdown[f.normalizedStatus] || 0) + 1;
}
console.log("Status breakdown:", breakdown);
