import { createServerSupabase } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const [{ count: activeReports }, { count: businessCount }, { count: emergencyCount }, { data: recentReports }] =
    await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("businesses").select("*", { count: "exact", head: true }),
      supabase.from("emergency_contacts").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("barangay").eq("status", "approved").order("created_at", { ascending: false }).limit(200),
    ]);

  const affectedCount = new Set(recentReports?.map((r) => r.barangay) ?? []).size;

  return (
    <HomeContent
      activeReports={activeReports ?? 0}
      businessCount={businessCount ?? 0}
      emergencyCount={emergencyCount ?? 0}
      affectedCount={affectedCount}
    />
  );
}
