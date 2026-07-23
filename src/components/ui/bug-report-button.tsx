"use client";

import { useState } from "react";
import { Bug, X, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { usePathname } from "next/navigation";

export function BugReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      toastError(t("Too short", lang), t("Please describe the issue in more detail.", lang));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), contact: contact.trim(), page: pathname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toastSuccess(t("Bug reported", lang), t("Thanks for helping improve WaterWatch.", lang));
      setSent(true);
    } catch (err: unknown) {
      toastError("Failed", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setSent(false); setDescription(""); setContact(""); }, 200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={handleClose}>
      <div className="bg-background border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Bug className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("Report a Bug", lang)}</h2>
              <p className="text-[11px] text-muted-foreground">{t("Find a bug in the system? Report it, enter the details of the bug.", lang)}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">{t("Bug Reported", lang)}</p>
            <p className="text-xs text-muted-foreground">{t("Thanks for helping improve WaterWatch.", lang)}</p>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">{t("Close", lang)}</Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Describe the bug", lang)} <span className="text-destructive">*</span></Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("What went wrong? What did you expect to happen?", lang)}
                rows={4}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("Contact", lang)} <span className="text-muted-foreground">{t("(optional)", lang)}</span></Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t("Email or FB Messenger — if you'd like a follow-up", lang)}
                className="h-9 text-sm"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full h-10 text-sm gap-2">
              {loading ? t("Sending…", lang) : <><Send className="h-3.5 w-3.5" /> {t("Submit Report", lang)}</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 sm:bottom-5 right-5 z-[9990] hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-foreground text-background shadow-lg text-xs font-medium hover:scale-105 transition-transform min-h-[44px] safe-bottom"
      >
        <Bug className="h-3.5 w-3.5" />
        {t("Report Bug", lang)}
      </button>
      <BugReportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
