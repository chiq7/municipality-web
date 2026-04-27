// サーバーコンポーネント: データをimportせずFacilityListにメタ情報のみ渡す
import { getPrefectures, STATUS_OPTIONS } from "@/lib/data";
import FacilityList from "./FacilityList";

export default function HomePage() {
  const prefectures = getPrefectures();
  return <FacilityList prefectures={prefectures} statusOptions={STATUS_OPTIONS} />;
}
