"use client";

import { useState } from "react";
import { Bug, X, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const pathname = usePathname();
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      toastError("Too short", "Please describe the issue in more detail.");
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
      toastSuccess("Bug reported", "Thanks for helping improve WaterWatch.");
      setSent(true);
    } catch (err: any) {
      toastError("Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setSent(false); }}
        className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-foreground text-background shadow-lg text-xs font-medium hover:scale-105 transition-transform"
      >
        <Bug className="h-3.5 w-3.5" />
        Report Bug
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => setOpen(false)}>
          <div className="bg-background border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <Bug className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Report a Bug</h2>
                  <p className="text-[11px] text-muted-foreground">Found an issue? Let us know.</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium">Bug Reported</p>
                <p className="text-xs text-muted-foreground">Thanks for helping improve WaterWatch.</p>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="mt-2">Close</Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Describe the bug <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What went wrong? What did you expect to happen?"
                    rows={4}
                    className="resize-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or FB Messenger — if you'd like a follow-up"
                    className="h-9 text-sm"
                  />
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full h-10 text-sm gap-2">
                  {loading ? "Sending…" : <><Send className="h-3.5 w-3.5" /> Submit Report</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
