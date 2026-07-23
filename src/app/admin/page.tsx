import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: string;
  announcementPage?: string;
  contactPage?: string;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
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

  const PAGE_SIZE = 15;
  const announcementPage = Math.max(0, parseInt(params.announcementPage || "0", 10) || 0);
  const contactPage = Math.max(0, parseInt(params.contactPage || "0", 10) || 0);

  const [
    { data: reports },
    { data: businesses },
    { data: announcements, count: announcementCount },
    { count: pendingCount },
    { data: allClaims },
    { data: bugReports },
    { count: approvedCount },
    { count: resolvedCount },
    { count: deniedCount },
    { count: verifiedBizCount },
    { data: contacts, count: contactCount },
    { count: staleCount },
    { count: allReportsCount },
    { count: allBusinessCount },
  ] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase.from("announcements").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(announcementPage * PAGE_SIZE, (announcementPage + 1) * PAGE_SIZE - 1),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("business_claims").select("*").order("created_at", { ascending: false }),
    supabase.from("bug_reports").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("denied", true),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("verified", true),
    supabase.from("emergency_contacts").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(contactPage * PAGE_SIZE, (contactPage + 1) * PAGE_SIZE - 1),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "stale"),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
  ]);

  return (
    <AdminDashboard
      reports={reports ?? []}
      businesses={businesses ?? []}
      announcements={announcements ?? []}
      pendingCount={pendingCount ?? 0}
      allClaims={allClaims ?? []}
      bugReports={bugReports ?? []}
      totalReports={allReportsCount ?? 0}
      totalBusinesses={allBusinessCount ?? 0}
      totalAnnouncements={announcementCount ?? 0}
      totalContacts={contactCount ?? 0}
      contacts={contacts ?? []}
      pageSize={PAGE_SIZE}
      approvedCount={approvedCount ?? 0}
      resolvedCount={resolvedCount ?? 0}
      deniedCount={deniedCount ?? 0}
      verifiedBizCount={verifiedBizCount ?? 0}
      staleCount={staleCount ?? 0}
      announcementPage={announcementPage}
      contactPage={contactPage}
    />
  );
}
