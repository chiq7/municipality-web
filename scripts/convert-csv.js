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

function normalizeStatus(raw) {
  if (!raw || raw.trim() === "") return "その他";
  const s = raw.trim();

  // 売却・貸付募集中
  if (
    s.includes("サウンディング") ||
    s.includes("売却・無償譲渡") ||
    s.includes("売却又は用途廃止") ||
    (s.includes("売却") && s.includes("募集")) ||
    (s.includes("貸付") && (s.includes("募集") || s.includes("検討中"))) ||
    s === "売却検討" ||
    s === "売却・無償譲渡検討中" ||
    s === "廃校済み。貸付・売却検討中、活用が見込めない施設は除却予定"
  )
    return "売却・貸付募集中";

  // 廃止済・活用中
  if (
    s.includes("廃止済み・地域交流") ||
    s.includes("廃止済み・普通財産") ||
    (s.includes("廃校") && s.includes("活用中")) ||
    (s.includes("廃校") && s.includes("賃貸")) ||
    (s.includes("廃止") && s.includes("活用中")) ||
    s === "廃止済（転用検討中）" ||
    s.includes("廃止済み・跡地活用") ||
    s.includes("廃止済み・売却または無償譲渡")
  )
    return "廃止済・活用中";

  // 廃止済・未利用
  if (
    s.includes("廃止済み・未利用") ||
    s.includes("廃止・未利用") ||
    s.includes("廃校・未利用") ||
    s === "廃止済み" ||
    s === "廃止済" ||
    s === "廃止・売却" ||
    s === "廃止・譲与" ||
    s === "廃止・返還" ||
    (s.startsWith("廃止") && !s.includes("予定") && !s.includes("検討")) ||
    s === "廃校" ||
    s === "廃校施設" ||
    s === "廃校（未利用施設）" ||
    s === "廃校・未利用"
  )
    return "廃止済・未利用";

  // 廃止予定
  if (
    s.includes("廃止予定") ||
    s.includes("廃止検討") ||
    s.includes("廃止検討中") ||
    s.includes("廃止検討対象") ||
    (s.includes("廃止") && s.includes("予定")) ||
    s.includes("廃校予定")
  )
    return "廃止予定";

  // 休止中
  if (s.includes("休止中")) return "休止中";

  return "その他";
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

  const normalizedStatus = normalizeStatus(rawStatus);
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
