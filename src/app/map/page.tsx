import { createServerSupabase } from "@/lib/supabase/server";
import { WaterMap } from "@/components/map/water-map";
import { AutoResolveTrigger } from "@/components/map/auto-resolve-trigger";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ISSUE_TYPES, ISSUE_EMOJI } from "@/lib/constants";
import { getConfidenceLevel } from "@/lib/utils";
import { ClipboardList, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createServerSupabase();
  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("name");

  const activeReports = reports?.filter((r) => r.status !== "resolved" && r.status !== "denied") ?? [];
  const totalReports = reports?.length ?? 0;

  const barangayCounts: Record<string, { total: number; confirmed: number }> = {};
  reports?.forEach((r) => {
    if (!barangayCounts[r.barangay]) barangayCounts[r.barangay] = { total: 0, confirmed: 0 };
    barangayCounts[r.barangay].total++;
    if (r.status === "approved" || r.status === "resolved" || r.status === "community_confirmed") barangayCounts[r.barangay].confirmed++;
  });

  const topBarangays = Object.entries(barangayCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const issueCounts: Record<string, number> = {};
  activeReports.forEach((r) => {
    issueCounts[r.issue_type] = (issueCounts[r.issue_type] || 0) + 1;
  });

  return (
    <div className="page-container py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Water Situation Map</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Community-reported water issues across SJDM barangays.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] sm:text-xs w-fit py-1">
          {totalReports} total reports
        </Badge>
      </div>

      <AutoResolveTrigger />
      <WaterMap reports={reports ?? []} businesses={businesses ?? []} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
            <MapPin className="h-4 w-4 text-water" />
            Most Reported Areas
          </h3>
          <div className="space-y-2.5 sm:space-y-3">
            {topBarangays.length > 0 ? topBarangays.map(([barangay, counts], i) => {
              const confidence = getConfidenceLevel(counts.total, counts.confirmed);
              return (
                <div key={barangay} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground w-4 sm:w-5 text-right shrink-0">{i + 1}.</span>
                    <span className="text-xs sm:text-sm font-medium truncate">{barangay}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{counts.total} reports</span>
                  </div>
                  <Badge variant={
                    confidence.color === "green" ? "success" :
                    confidence.color === "yellow" ? "warning" : "secondary"
                  } className="text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0">
                    {confidence.level}
                  </Badge>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">No reports yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
            <AlertTriangle className="h-4 w-4 text-water" />
            Current Issues
          </h3>
          <div className="space-y-2.5 sm:space-y-3">
            {ISSUE_TYPES.map((issue) => (
              <div key={issue.value} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">{ISSUE_EMOJI[issue.value]}</span>
                  <span className="text-xs sm:text-sm">{issue.label}</span>
                </div>
                <span className="text-sm sm:text-base font-semibold tabular-nums">{issueCounts[issue.value] || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Active Reports", value: activeReports.length, icon: ClipboardList, color: "text-water" },
          { label: "Barangays", value: new Set(activeReports.map((r) => r.barangay)).size, icon: MapPin, color: "text-orange-500" },
          { label: "Resolved", value: reports?.filter((r) => r.status === "resolved").length ?? 0, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Total Reports", value: totalReports, icon: AlertTriangle, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card text-center py-3 sm:py-5">
            <stat.icon className={cn("h-3.5 sm:h-4 w-3.5 sm:w-4 mx-auto mb-1", stat.color)} />
            <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-2">
        Resolved reports are marked by community members — not by the water provider.
      </p>
    </div>
  );
}
