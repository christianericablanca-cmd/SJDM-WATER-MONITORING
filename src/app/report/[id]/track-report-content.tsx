"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_DOTS, STATUS_LABELS, ISSUE_TYPES, ISSUE_EMOJI } from "@/lib/constants";
import { cn, formatDate, getConfidenceLevel } from "@/lib/utils";
import { AutoResolveTrigger } from "@/components/map/auto-resolve-trigger";
import { ReactivateById } from "@/components/reports/reactivate-by-id";
import { MarkResolved } from "@/components/reports/mark-resolved";
import { Clock, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

interface TrackReportData {
  report_id_display: string;
  issue_type: string;
  barangay: string;
  status: string;
  description?: string;
  started_at: string;
  resolved_at?: string;
  confirmation_count?: number;
  denied: boolean;
  denied_reason?: string;
  verified?: boolean;
}

interface TrackReportContentProps {
  report: TrackReportData;
  reportId: string;
}

export function TrackReportContent({ report, reportId }: TrackReportContentProps) {
  const { lang } = useLanguage();

  const issue = ISSUE_TYPES.find((t) => t.value === report.issue_type);

  const statusSteps = report.denied ? [
    { key: "submitted", label: t("Submitted", lang), desc: t("Report has been received", lang) },
    { key: "denied", label: t("Denied", lang), desc: t("Report was not approved by the community team", lang) },
  ] : [
    { key: "submitted", label: t("Submitted", lang), desc: t("Report has been received", lang) },
    { key: "under_review", label: t("Under Review", lang), desc: t("Pending approval from the community team", lang) },
    { key: "approved", label: t("Approved", lang), desc: t("Report has been reviewed and verified", lang) },
    { key: "resolved", label: t("Resolved", lang), desc: t("Water issue has been resolved", lang) },
    { key: "stale", label: t("Inactive", lang), desc: t("No new reports for 7 days — issue may still persist", lang) },
  ];
  const statusOrder = report.denied ? ["submitted", "denied"] : ["submitted", "under_review", "approved", "resolved", "stale"];
  const effectiveStatus = report.status;
  const currentStep = statusOrder.indexOf(effectiveStatus);

  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="section-title">{t("Track Report", lang)}</h1>
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
                effectiveStatus === "stale" ? "secondary" : "outline"
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
                <span>{t("Started", lang)} {formatDate(report.started_at)}</span>
              </div>
              {report.resolved_at && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  {report.status === "resolved" ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4" />}
                  <span>{report.status === "resolved" ? t("Resolved ", lang) : t("Inactive since ", lang)}{formatDate(report.resolved_at)}</span>
                </div>
              )}
            </div>
            {report.confirmation_count !== undefined && report.confirmation_count > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t("Community confirmations:", lang)}</span>
                <span className="font-bold text-water">{report.confirmation_count}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-base">{t("Status Progress", lang)}</CardTitle>
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
              <strong>{t("Reason for denial:", lang)}</strong> {report.denied_reason}
            </div>
          </div>
        )}

        {report.verified && report.status !== "resolved" && report.status !== "stale" && !report.denied && (
          <MarkResolved reportId={report.report_id_display} />
        )}

        {(report.status === "stale" || report.status === "resolved") && !report.denied && (
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t(`Reports go inactive after 7 days of no confirmations. To reactivate, submit a new report at the same location — we will automatically match and reactivate the original report. You can also reactivate from the Track Report page using your Report ID.`, lang)}</span>
            </div>
            <ReactivateById />
          </div>
        )}

        <AutoResolveTrigger />
      </div>
    </div>
  );
}
