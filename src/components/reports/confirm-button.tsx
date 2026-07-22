"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";

interface ConfirmButtonProps {
  reportId: string;
  initialCount: number;
}

export function ConfirmButton({ reportId, initialCount }: ConfirmButtonProps) {
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
          toastSuccess("Re-activated!", "This report was marked resolved but your confirmation brought it back. Neighbors still need help!");
        } else {
          toastSuccess("Confirmed!", "Thanks for helping verify this report. The community confidence has been updated.");
        }
      } else if (res.status === 429) {
        toastError("Too many confirmations", "Please wait a moment before confirming more reports.");
      } else {
        const data = await res.json();
        if (data.message === "Already confirmed") {
          setConfirmed(true);
          sessionStorage.setItem(`confirmed_${reportId}`, "true");
          toastInfo("Already confirmed", "You've already confirmed this report.");
        } else {
          throw new Error(data.error || "Something went wrong");
        }
      }
    } catch (err: any) {
      toastError("Couldn't confirm", err.message || "Please check your connection and try again.");
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
      {confirmed ? "Confirmed" : "I have this too"}
    </Button>
  );
}
