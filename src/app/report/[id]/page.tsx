import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_DOTS, STATUS_LABELS, ISSUE_TYPES, ISSUE_EMOJI } from "@/lib/constants";
import { formatDate, getConfidenceLevel } from "@/lib/utils";
import { notFound } from "next/navigation";
import { AutoResolveTrigger } from "@/components/map/auto-resolve-trigger";
import { ReactivateById } from "@/components/reports/reactivate-by-id";
import { MarkResolved } from "@/components/reports/mark-resolved";
import { Clock, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrackReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reportId = `SJDM-WATER-${id.padStart(5, "0")}`;

  const supabase = await createServerSupabase();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("report_id_display", reportId)
    .single();

  if (!report) notFound();

  const issue = ISSUE_TYPES.find((t) => t.value === report.issue_type);

  const statusSteps = report.denied ? [
    { key: "submitted", label: "Submitted", desc: "Report has been received" },
    { key: "denied", label: "Denied", desc: "Report was not approved by the community team" },
  ] : [
    { key: "submitted", label: "Submitted", desc: "Report has been received" },
    { key: "under_review", label: "Under Review", desc: "Pending approval from the community team" },
    { key: "approved", label: "Approved", desc: "Report has been reviewed and verified" },
    { key: "resolved", label: "Resolved", desc: "Water issue has been resolved" },
    { key: "stale", label: "Inactive", desc: "No new reports for 7 days — issue may still persist" },
  ];
  const statusOrder = report.denied ? ["submitted", "denied"] : ["submitted", "under_review", "approved", "resolved", "stale"];
  const effectiveStatus = report.status;
  const currentStep = statusOrder.indexOf(effectiveStatus);

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="section-title">Track Report</h1>
          <p className="font-mono text-water text-lg font-bold mt-1">{reportId}</p>
        </div>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{issue?.emoji}</span>
                <div>
                  <CardTitle className="text-lg">{report.barangay}</CardTitle>
                  <CardDescription>{issue?.label}</CardDescription>
                </div>
              </div>
              <Badge variant={
                effectiveStatus === "approved" ? "success" :
                effectiveStatus === "stale" ? "secondary" :
                effectiveStatus === "under_review" ? "default" : "outline"
              }>
                {STATUS_LABELS[effectiveStatus] || effectiveStatus.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.description && (
              <p className="text-sm text-muted-foreground">{report.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Started {formatDate(report.started_at)}</span>
              </div>
              {report.resolved_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  {report.status === "resolved" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4" />}
                  <span>{report.status === "resolved" ? "Resolved " : "Inactive since "}{formatDate(report.resolved_at)}</span>
                </div>
              )}
            </div>
            {report.confirmation_count !== undefined && report.confirmation_count > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Community confirmations:</span>
                <span className="font-bold text-water">{report.confirmation_count}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Status Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const done = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        done ? "bg-water text-white" : "bg-muted border-2 border-border",
                        isCurrent && "ring-2 ring-water/30",
                      )}>
                        {done && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-8",
                          done ? "bg-water" : "bg-border",
                        )} />
                      )}
                    </div>
                    <div className={cn(
                      "pb-6",
                      i === statusSteps.length - 1 && "pb-0",
                    )}>
                      <p className={cn(
                        "text-sm font-medium",
                        done ? "text-foreground" : "text-muted-foreground",
                      )}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {report.denied && report.denied_reason && (
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Reason for denial:</strong> {report.denied_reason}
            </div>
          </div>
        )}

        {report.verified && report.status !== "resolved" && report.status !== "stale" && !report.denied && (
          <MarkResolved reportId={report.report_id_display} />
        )}

        {!report.denied && report.status !== "resolved" && report.status !== "stale" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Reports go <strong>inactive</strong> after <strong>7 days</strong> with no confirmations. If this issue is still ongoing, tap "I have this too" below, submit a new report at the same location, or use your Report ID to <ReactivateById />.</span>
          </div>
        )}

        <AutoResolveTrigger />
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
