import { getPrefectures, STATUS_OPTIONS, getFacilityCounts } from "@/lib/data";
import FacilityList from "./FacilityList";

export default function HomePage() {
  const prefectures = getPrefectures();
  const facilityCounts = getFacilityCounts();
  return (
    <FacilityList
      prefectures={prefectures}
      statusOptions={STATUS_OPTIONS}
      facilityCounts={facilityCounts}
    />
  );
}
