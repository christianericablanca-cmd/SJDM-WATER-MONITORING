import { createServerSupabase } from "@/lib/supabase/server";
import { WaterMap } from "@/components/map/water-map";
import { AutoResolveTrigger } from "@/components/map/auto-resolve-trigger";
import { DamLevelWidget } from "@/components/map/dam-level-widget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ISSUE_TYPES, ISSUE_EMOJI, BARANGAYS } from "@/lib/constants";
import { getConfidenceLevel } from "@/lib/utils";
import { ClipboardList, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { t } from "@/lib/i18n";

const MARKER_COLORS: Record<string, string> = {
  no_water: "#dc2626",
  low_pressure: "#ea580c",
  dirty_water: "#a16207",
  water_leak: "#2563eb",
  pipe_infrastructure: "#7c3aed",
  other: "#6b7280",
};

export const revalidate = 30;

export default async function MapPage() {
  const supabase = await createServerSupabase();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "tl";
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

  const maxAreaReports = topBarangays[0]?.[1]?.total ?? 1;

  const issueCounts: Record<string, number> = {};
  activeReports.forEach((r) => {
    issueCounts[r.issue_type] = (issueCounts[r.issue_type] || 0) + 1;
  });
  const totalActive = activeReports.length || 1;

  return (
    <div className="page-container py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("Water Situation Map", lang)}</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            {t("Community-reported water issues across SJDM barangays.", lang)}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] sm:text-xs w-fit py-1">
          {totalReports} {t("total reports", lang)}
        </Badge>
      </div>

      <AutoResolveTrigger />
      <WaterMap reports={reports ?? []} businesses={businesses ?? []} />
      <DamLevelWidget />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: t("Active Reports", lang), value: activeReports.length, icon: ClipboardList, color: "text-water", bg: "bg-water-muted" },
          { label: t("Barangays with Issues", lang), value: new Set(activeReports.map((r) => r.barangay)).size, total: BARANGAYS.length, icon: MapPin, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: t("Resolved", lang), value: reports?.filter((r) => r.status === "resolved").length ?? 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { label: t("Total Reports", lang), value: totalReports, icon: AlertTriangle, color: "text-foreground", bg: "bg-muted dark:bg-muted/50" },
        ] as const).map((stat: any) => (
          <Card key={stat.label} className="p-3 sm:p-4 shadow-card flex items-center gap-3">
            <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
              <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold tabular-nums leading-tight">
                {stat.value}{stat.total ? <span className="text-sm font-normal text-muted-foreground"> / {stat.total}</span> : null}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center -mt-1">
        {t("Resolved reports are marked by community members — not by the water provider.", lang)}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
            <MapPin className="h-4 w-4 text-water" />
            {t("Most Reported Areas", lang)}
          </h3>
          <div className="space-y-3">
            {topBarangays.length > 0 ? topBarangays.map(([barangay, counts], i) => {
              const confidence = getConfidenceLevel(counts.total, counts.confirmed);
              const barWidth = Math.max((counts.total / maxAreaReports) * 100, 12);
              return (
                <div key={barangay}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground w-4 text-right shrink-0">{i + 1}.</span>
                      <span className="text-xs sm:text-sm font-medium truncate">{barangay}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] sm:text-xs tabular-nums font-semibold">{counts.total}</span>
                      <Badge variant={
                        confidence.color === "green" ? "success" :
                        confidence.color === "yellow" ? "warning" : "secondary"
                      } className="text-[10px] px-1 py-0">
                        {confidence.level}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all",
                      confidence.color === "green" ? "bg-emerald-500" : confidence.color === "yellow" ? "bg-orange-400" : "bg-muted-foreground/30"
                    )} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("No reports yet.", lang)}</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
            <AlertTriangle className="h-4 w-4 text-water" />
            {t("Current Issues", lang)}
          </h3>
          <div className="space-y-3">
            {ISSUE_TYPES.map((issue) => {
              const count = issueCounts[issue.value] || 0;
              const pct = Math.max(Math.round((count / totalActive) * 100), count > 0 ? 4 : 0);
              return (
                <div key={issue.value}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-sm sm:text-base">{ISSUE_EMOJI[issue.value]}</span>
                      <span className="text-[10px] sm:text-xs">{t(issue.label, lang)}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold tabular-nums shrink-0">{count} <span className="text-[10px] text-muted-foreground font-normal">{pct}%</span></span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${pct}%`,
                      backgroundColor: MARKER_COLORS[issue.value] || "#6b7280",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
