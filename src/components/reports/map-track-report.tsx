"use client";

import { useState } from "react";
import { useLanguage } from "@/components/ui/language-provider";
import { useToast } from "@/components/ui/toast-provider";
import { t } from "@/lib/i18n";
import { ISSUE_TYPES, STATUS_LABELS, STATUS_DOTS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface ReportData {
  report_id_display: string;
  barangay: string;
  issue_type: string;
  status: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  started_at: string;
  resolved_at: string | null;
  verified: boolean;
  denied: boolean;
  denied_reason: string | null;
  confirmation_count: number | null;
}

export function MapTrackReport() {
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError } = useToast();
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async () => {
    const trimmed = reportId.trim().toUpperCase();
    if (!trimmed) { toastError(t("Enter a Report ID", lang), t("Format: SJDM-XXXXX-XXXXX", lang)); return; }
    setLoading(true);
    setReport(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/reports/lookup?id=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        if (res.status === 404) setNotFound(true);
        else toastError(t("Error", lang), t("Something went wrong", lang));
        return;
      }
      const data = await res.json();
      setReport(data);
    } catch {
      toastError(t("Error", lang), t("Connection error. Please try again.", lang));
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!report) return;
    setResolving(true);
    try {
      const res = await fetch("/api/reports/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: report.report_id_display }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(t("Failed", lang), data.error || t("Something went wrong", lang));
      } else {
        toastSuccess(t("Marked as resolved!", lang), t("Your report has been marked as resolved.", lang));
        setReport({ ...report, status: "resolved", resolved_at: new Date().toISOString() });
      }
    } catch {
      toastError(t("Failed", lang), t("Connection error. Please try again.", lang));
    } finally {
      setResolving(false);
    }
  };

  const issue = ISSUE_TYPES.find((i) => i.value === report?.issue_type);
  const canResolve = report?.verified && !report.denied && report.status !== "resolved" && report.status !== "stale";

  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{t("Track a Report", lang)}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{t("Already have a Report ID?", lang)}</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={reportId}
          onChange={(e) => { setReportId(e.target.value); setNotFound(false); }}
          placeholder="SJDM-XXXXX-XXXXX"
          className="h-9 font-mono text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleTrack()}
        />
        <Button onClick={handleTrack} size="sm" className="h-9 gap-1.5 shrink-0" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {t("Track", lang)}
        </Button>
      </div>

      {notFound && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 p-2.5 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("Report not found. Double-check your Report ID.", lang)}</span>
        </div>
      )}

      {report && (
        <div className="border border-border/60 rounded-lg divide-y divide-border/60">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{issue?.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{report.barangay}</p>
                  <p className="text-xs text-muted-foreground">{issue?.label}</p>
                </div>
              </div>
              <span className="text-xs">{STATUS_DOTS[report.status]} {STATUS_LABELS[report.status]}</span>
            </div>
            {report.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{t("Submitted", lang)} {formatDate(report.created_at)}</span>
              {(report.confirmation_count ?? 0) > 0 && (
                <span>{report.confirmation_count}x {t("Community confirmations:", lang)}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs flex-1 gap-1.5"
              onClick={() => {
                const el = document.getElementById("water-map");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <MapPin className="h-3.5 w-3.5" />
              {t("View on Map", lang)}
            </Button>

            {canResolve && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {t("Mark Resolved", lang)}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
