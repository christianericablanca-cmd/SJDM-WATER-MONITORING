import { createServerSupabase } from "@/lib/supabase/server";
import { MapContent } from "./map-content";
import type { WaterReport, Business } from "@/lib/types";

export const revalidate = 60;

export default async function MapPage() {
  const supabase = await createServerSupabase();

  const [{ data: reports }, { count: totalApproved }] = await Promise.all([
    supabase.from("reports").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("name");

  const totalReports = totalApproved ?? reports?.length ?? 0;

  return (
    <MapContent
      reports={(reports ?? [])}
      businesses={(businesses ?? [])}
      totalReports={totalReports}
    />
  );
}
