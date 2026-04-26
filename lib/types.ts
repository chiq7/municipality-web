export type NormalizedStatus =
  | "廃止予定"
  | "廃止済・未利用"
  | "廃止済・活用中"
  | "休止中"
  | "売却・貸付募集中"
  | "その他";

export type FacilityType =
  | "温泉施設"
  | "廃校（旧学校）"
  | "宿泊・観光施設"
  | "体育館・スポーツ施設"
  | "公民館・集会施設"
  | "公園・レクリエーション施設"
  | "倉庫・ストレージ"
  | "庁舎・行政施設"
  | "医療・福祉施設"
  | "未分類";

export interface Facility {
  id: string;
  prefecture: string;
  municipality: string;
  pdfUrl: string;
  municipalityUrl: string | null;
  facilityName: string;
  rawStatus: string;
  normalizedStatus: NormalizedStatus;
  keywords: string[];
  excerpt: string;
  treasureScore: number;
  scoreReason: string;
  facilityType: FacilityType;
  dataAcquiredDate: string;
  // 未取得フィールド
  exactAddress: string | null;
  area: string | null;
  buildYear: string | null;
  electricity: string | null;
  water: string | null;
  gas: string | null;
  photoUrl: string | null;
  department: string | null;
  contactEmail: string | null;
  lastVerifiedDate: string | null;
  verificationMethod: string | null;
  // 将来用（現在非表示）
  activationPotential: string | null;
  activationNotes: string | null;
}

export interface SubsidyInfo {
  name: string;
  description: string;
  url: string;
  ministry: string;
}
