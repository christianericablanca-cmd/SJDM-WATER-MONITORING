import { createServerSupabase } from "@/lib/supabase/server";
import { WaterMapWrapper as WaterMap } from "@/components/map/water-map-wrapper";
import { AutoResolveTrigger } from "@/components/map/auto-resolve-trigger";
import { DamLevelWidget } from "@/components/map/dam-level-widget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ISSUE_TYPES, ISSUE_EMOJI, BARANGAYS, WATER_PROVIDER_LABELS } from "@/lib/constants";
import { getConfidenceLevel } from "@/lib/utils";
import { ClipboardList, MapPin, AlertTriangle, Droplets, Building2 } from "lucide-react";
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

export const revalidate = 60;

export default async function MapPage() {
  const supabase = await createServerSupabase();
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "tl";

  const [{ data: reports }, { count: totalApproved }] = await Promise.all([
    supabase.from("reports").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("name");

  const activeReports = reports ?? [];
  const totalReports = totalApproved ?? reports?.length ?? 0;

  const barangayCounts: Record<string, { total: number; confirmed: number }> = {};
  reports?.forEach((r) => {
    if (!barangayCounts[r.barangay]) barangayCounts[r.barangay] = { total: 0, confirmed: 0 };
    barangayCounts[r.barangay].total++;
    if (r.status === "approved" || r.status === "resolved") barangayCounts[r.barangay].confirmed++;
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

  const topIssue = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])[0];
  const topIssueLabel = topIssue ? ISSUE_TYPES.find((i) => i.value === topIssue[0])?.label ?? topIssue[0] : "—";

  const providerCounts: Record<string, number> = {};
  activeReports.forEach((r) => {
    providerCounts[r.water_provider] = (providerCounts[r.water_provider] || 0) + 1;
  });

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
          {totalReports} {t("active issues", lang)}
        </Badge>
      </div>

      <AutoResolveTrigger />
      <WaterMap reports={reports ?? []} businesses={businesses ?? []} />
      <DamLevelWidget />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: t("Active Issues", lang), value: activeReports.length, icon: ClipboardList, color: "text-water", bg: "bg-water-muted" },
          { label: t("Barangays Affected", lang), value: new Set(activeReports.map((r) => r.barangay)).size, total: BARANGAYS.length, icon: MapPin, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
          { label: t("Main Issue", lang), value: topIssueLabel, icon: Droplets, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: t("Provider", lang), value: `${WATER_PROVIDER_LABELS["primewater"]} ${providerCounts.primewater ?? 0} · ${WATER_PROVIDER_LABELS["metro_pacific"]} ${providerCounts.metro_pacific ?? 0}`, icon: Building2, color: "text-foreground", bg: "bg-muted dark:bg-muted/50" },
        ]).map((stat: { label: string; value: string | number; total?: number; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) => (
          <Card key={stat.label} className="p-3 sm:p-4 shadow-card flex items-center gap-3">
            <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
              <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold leading-tight">
                {stat.value}{stat.total ? <span className="text-xs font-normal text-muted-foreground"> / {stat.total}</span> : null}
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
          {topBarangays.length > 0 ? (() => {
            const total = topBarangays.reduce((s, [, c]) => s + c.total, 0);
            const colors = ["#dc2626", "#ea580c", "#2563eb", "#7c3aed", "#059669"];
            return (
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shrink-0" style={{
                  background: `conic-gradient(${topBarangays.map(([, counts], i) => {
                    const pct = (counts.total / total) * 100;
                    const start = topBarangays.slice(0, i).reduce((s, [, c]) => s + (c.total / total) * 100, 0);
                    return `${colors[i % colors.length]} ${start}% ${start + pct}%`;
                  }).join(", ")})`,
                }}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-background m-auto relative top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold tabular-nums">{total}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {topBarangays.map(([barangay, counts], i) => {
                    const confidence = getConfidenceLevel(counts.total, counts.confirmed);
                    const pct = Math.round((counts.total / total) * 100);
                    return (
                      <div key={barangay} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                          <span className="text-[10px] sm:text-xs truncate">{barangay}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] sm:text-xs tabular-nums font-medium">{counts.total} ({pct}%)</span>
                          <Badge variant={
                            confidence.color === "green" ? "success" :
                            confidence.color === "yellow" ? "warning" : "secondary"
                          } className="text-[9px] px-1 py-0">{confidence.level}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <p className="text-sm text-muted-foreground text-center py-4">{t("No reports yet.", lang)}</p>
          )}
        </Card>

        <Card className="p-4 sm:p-5 shadow-card">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-4">
            <AlertTriangle className="h-4 w-4 text-water" />
            {t("Current Issues", lang)}
          </h3>
          {totalActive > 0 ? (
            <div className="space-y-2.5">
              {ISSUE_TYPES.filter((i) => (issueCounts[i.value] || 0) > 0).map((issue) => {
                const count = issueCounts[issue.value] || 0;
                const pct = Math.round((count / totalActive) * 100);
                return (
                  <div key={issue.value} className="flex items-center gap-2">
                    <span className="text-sm sm:text-base shrink-0">{ISSUE_EMOJI[issue.value]}</span>
                    <span className="text-[10px] sm:text-xs truncate flex-1 min-w-0">{t(issue.label, lang)}</span>
                    <div className="flex items-center gap-0.5 justify-center flex-1">
                      {Array.from({ length: Math.min(count, 20) }).map((_, j) => (
                        <span key={j} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: MARKER_COLORS[issue.value] || "#6b7280" }} />
                      ))}
                      {count > 20 && <span className="text-[9px] text-muted-foreground ml-0.5">+{count - 20}</span>}
                    </div>
                    <span className="text-[10px] sm:text-xs tabular-nums font-medium shrink-0 w-12 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t("No reports yet.", lang)}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
