"use client";

import { Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";

export default function Loading() {
  const { lang } = useLanguage();

  return (
    <div className="page-container py-24 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 text-water animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">{t("Loading…", lang)}</p>
      </div>
    </div>
  );
}
