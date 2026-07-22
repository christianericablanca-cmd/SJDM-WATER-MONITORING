"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import { CheckCircle2, Loader2 } from "lucide-react";

export function MarkResolved({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Failed", data.error || "Something went wrong");
      } else {
        toastSuccess("Marked as resolved!", "Your report has been marked as resolved.");
        router.refresh();
      }
    } catch {
      toastError("Failed", "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1">
        <strong>Water is back?</strong> If your water supply has returned to normal, mark this report as resolved.
        <div className="mt-2">
          <Button size="sm" variant="outline" onClick={handleResolve} disabled={loading}
            className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-100">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Mark as Resolved
          </Button>
        </div>
      </div>
    </div>
  );
}
