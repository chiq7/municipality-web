import type { Facility, SubsidyInfo } from "./types";

const SUBSIDIES: Record<string, SubsidyInfo> = {
  haiko: {
    name: "廃校施設等活用事業費補助金",
    description: "廃校施設の改修・活用に対する文部科学省の補助金（改修費の1/3以内）",
    url: "https://www.mext.go.jp/a_menu/shotou/zyosei/1303531.htm",
    ministry: "文部科学省",
  },
  kanko: {
    name: "観光地域づくり・観光産業強化推進事業費補助金",
    description: "観光施設・宿泊施設の整備・改修に対する観光庁の補助金",
    url: "https://www.mlit.go.jp/kankocho/shisaku/kankochi/index.html",
    ministry: "観光庁",
  },
  nousan: {
    name: "農山漁村振興交付金（農泊推進対策）",
    description: "農山漁村での体験・宿泊施設整備に対する農林水産省の交付金",
    url: "https://www.maff.go.jp/j/nousin/nouson/index.html",
    ministry: "農林水産省",
  },
  jfc: {
    name: "新規開業資金（日本政策金融公庫）",
    description: "新たに事業を始める方向けの低利融資（上限7,200万円）",
    url: "https://www.jfc.go.jp/n/finance/search/01_shinki_m.html",
    ministry: "日本政策金融公庫",
  },
};

// 確定情報に基づく補助金のみ返す（不確かなものは除外）
export function getApplicableSubsidies(facility: Facility): SubsidyInfo[] {
  const result: SubsidyInfo[] = [];
  const kwText = facility.keywords.join(" ") + " " + facility.facilityName;

  if (
    facility.facilityType === "廃校（旧学校）" ||
    kwText.includes("廃校")
  ) {
    result.push(SUBSIDIES.haiko);
  }

  if (
    facility.facilityType === "温泉施設" ||
    facility.facilityType === "宿泊・観光施設" ||
    kwText.includes("温泉") ||
    kwText.includes("宿泊") ||
    kwText.includes("観光")
  ) {
    result.push(SUBSIDIES.kanko);
  }

  // 農村エリア判定：北海道・東北・中国・四国・九州の非政令市（簡易判定）
  const ruralPrefectures = ["北海道", "青森", "岩手", "秋田", "山形", "島根", "鳥取", "高知", "徳島"];
  if (
    ruralPrefectures.some((p) => facility.prefecture.includes(p)) ||
    kwText.includes("農村") ||
    kwText.includes("農山漁村")
  ) {
    result.push(SUBSIDIES.nousan);
  }

  // 新規開業融資は廃止済・未利用 or 売却・貸付募集中の場合のみ表示
  if (
    facility.normalizedStatus === "廃止済・未利用" ||
    facility.normalizedStatus === "売却・貸付募集中"
  ) {
    result.push(SUBSIDIES.jfc);
  }

  return result;
}
