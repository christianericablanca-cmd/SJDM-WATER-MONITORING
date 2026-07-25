import { createServerSupabase } from "@/lib/supabase/server";
import { HomeContent } from "./home-content";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const results = await Promise.allSettled([
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("emergency_contacts").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("barangay").eq("status", "approved").order("created_at", { ascending: false }).limit(200),
  ]);

  const activeReports = results[0].status === "fulfilled" ? results[0].value.count : 0;
  const businessCount = results[1].status === "fulfilled" ? results[1].value.count : 0;
  const emergencyCount = results[2].status === "fulfilled" ? results[2].value.count : 0;
  const recentReports = results[3].status === "fulfilled" ? results[3].value.data : [];

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
