"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { Search } from "lucide-react";

export function TrackReportLookup() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { error: toastError } = useToast();
  const [reportId, setReportId] = useState("");

  const handleTrack = () => {
    const trimmed = reportId.trim().toUpperCase();
    if (!trimmed) { toastError(t("Enter a Report ID", lang), t("e.g. SJDM-WATER-00002", lang)); return; }

    const match = trimmed.match(/SJDM-WATER-0*(\d+)/i);
    if (!match) { toastError(t("Invalid format", lang), t("Format should be SJDM-WATER-00002", lang)); return; }

    router.push("/report/" + match[1]);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={reportId}
        onChange={(e) => setReportId(e.target.value)}
        placeholder="SJDM-WATER-00002"
        className="h-9 font-mono text-xs flex-1"
        onKeyDown={(e) => e.key === "Enter" && handleTrack()}
      />
      <Button onClick={handleTrack} size="sm" className="h-9 gap-1.5 shrink-0">
        <Search className="h-3.5 w-3.5" />
        {t("Track", lang)}
      </Button>
    </div>
  );
}
