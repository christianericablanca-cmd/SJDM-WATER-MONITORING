"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReactivateById() {
  const [showInput, setShowInput] = useState(false);
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; cooldown?: boolean } | null>(null);
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const handleReactivate = async () => {
    const trimmed = reportId.trim();
    if (!trimmed) { toastError(t("Enter a Report ID", lang), t("Please enter your Report ID.", lang)); return; }
    setLoading(true);
    setResult(null);
    toastInfo(t("Reactivating…", lang), t("Looking up your report.", lang));
    try {
      const res = await fetch("/api/reports/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, message: data.error || t("Something went wrong", lang), cooldown: data.cooldown });
        if (!data.cooldown) toastError(t("Reactivate failed", lang), data.error || t("Something went wrong", lang));
      } else {
        setResult({ success: true, message: `${t("Report", lang)} ${data.report_id_display} ${t("is now active and waiting for admin review.", lang)}` });
        toastSuccess(t("Reactivated!", lang), `${t("Report", lang)} ${data.report_id_display} ${t("is now active.", lang)}`);
        setReportId("");
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || t("Connection error. Please try again.", lang) });
      toastError(t("Reactivate failed", lang), err.message || t("Connection error. Please try again.", lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <span>
      <button
        type="button"
        onClick={() => { setShowInput(!showInput); setResult(null); }}
        className="underline font-medium cursor-pointer"
      >
        {t("reactivate it here", lang)}
      </button>
      {showInput && (
        <div className="mt-3 p-3 bg-background border rounded-lg space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground">{t("Enter your Report ID to reactivate an inactive or resolved report. Limited to once per 24h.", lang)}</p>
          <div className="flex gap-2">
            <Input
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              placeholder="SJDM-WATER-00002"
              className="h-9 flex-1 font-mono text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleReactivate()}
            />
            <Button onClick={handleReactivate} disabled={loading} size="sm" className="h-9 gap-1.5 shrink-0">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {t("Reactivate", lang)}
            </Button>
          </div>
          {result && (
            <div className={cn(
              "text-xs p-2.5 rounded-lg flex items-start gap-2",
              result.success ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" :
              result.cooldown ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200" :
              "bg-destructive/10 border border-destructive/20 text-destructive",
            )}>
              {result.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
               result.cooldown ? <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" /> :
               <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
              <div>
                <p className="font-medium">{result.success ? t("Reactivated!", lang) : result.cooldown ? t("Cooldown active", lang) : t("Could not reactivate", lang)}</p>
                <p>{result.message}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
