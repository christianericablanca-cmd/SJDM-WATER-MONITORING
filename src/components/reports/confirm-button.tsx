"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

interface ConfirmButtonProps {
  reportId: string;
  initialCount: number;
}

export function ConfirmButton({ reportId, initialCount }: ConfirmButtonProps) {
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [count, setCount] = useState(initialCount);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasConfirmed = sessionStorage.getItem(`confirmed_${reportId}`);
    if (hasConfirmed) setConfirmed(true);
  }, [reportId]);

  const handleConfirm = async () => {
    if (confirmed || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCount((c) => c + 1);
        setConfirmed(true);
        sessionStorage.setItem(`confirmed_${reportId}`, "true");
        if (data.re_activated) {
          toastSuccess(t("Re-activated!", lang), t("This report was marked resolved but your confirmation brought it back. Neighbors still need help!", lang));
        } else {
          toastSuccess(t("Confirmed!", lang), t("Thanks for helping verify this report. The community confidence has been updated.", lang));
        }
      } else if (res.status === 429) {
        toastError(t("Too many confirmations", lang), t("Please wait a moment before confirming more reports.", lang));
      } else {
        const data = await res.json();
        if (data.message === "Already confirmed") {
          setConfirmed(true);
          sessionStorage.setItem(`confirmed_${reportId}`, "true");
          toastInfo(t("Already confirmed", lang), t("You've already confirmed this report.", lang));
        } else {
          throw new Error(data.error || "Something went wrong");
        }
      }
    } catch (err: any) {
      toastError(t("Couldn't confirm", lang), err.message || t("Please check your connection and try again.", lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={confirmed ? "default" : "outline"}
      size="sm"
      onClick={handleConfirm}
      disabled={confirmed || loading}
      className={cn(
        "gap-1.5 transition-all",
        confirmed && "bg-water text-white hover:bg-water/90 border-water",
        loading && "opacity-70",
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ThumbsUp className={cn("h-3.5 w-3.5", confirmed && "fill-current")} />
      )}
      {!loading && count > 0 && <span className="tabular-nums">{count}</span>}
      {confirmed ? t("Confirmed", lang) : t("I have this too", lang)}
    </Button>
  );
}
