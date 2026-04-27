// サーバーコンポーネント: 対象施設のみクライアントに渡す（全件ロード防止）
import { notFound } from "next/navigation";
import { getFacilityById, facilities } from "@/lib/data";
import AdminEdit from "./AdminEdit";

export async function generateStaticParams() {
  return facilities.map((f) => ({ id: f.id }));
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const facility = getFacilityById(id);
  if (!facility) notFound();

  return <AdminEdit facility={facility} />;
}
