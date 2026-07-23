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
    if (!trimmed) { toastError(t("Enter a Report ID", lang), t("e.g. SJDM-PRIME-A3X9K", lang)); return; }

    const match = trimmed.match(/^SJDM-([A-Z0-9]+-[A-Z0-9]{5})$/i);
    if (!match) { toastError(t("Invalid format", lang), t("Format should be SJDM-XXXXX-XXXXX", lang)); return; }

    router.push("/report/" + match[1].toUpperCase());
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={reportId}
        onChange={(e) => setReportId(e.target.value)}
        placeholder="SJDM-XXXXX-XXXXX"
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
