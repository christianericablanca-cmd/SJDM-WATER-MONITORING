import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have admin permissions.</p>
      </div>
    );
  }

  const [
    { data: reports },
    { data: businesses },
    { data: announcements },
    { count: pendingCount },
    { data: allClaims },
    { data: bugReports },
  ] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("businesses").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("business_claims").select("*").order("created_at", { ascending: false }),
    supabase.from("bug_reports").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <AdminDashboard
      reports={reports ?? []}
      businesses={businesses ?? []}
      announcements={announcements ?? []}
      pendingCount={pendingCount ?? 0}
      allClaims={allClaims ?? []}
      bugReports={bugReports ?? []}
    />
  );
}
