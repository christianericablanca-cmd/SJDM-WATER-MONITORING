"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-container py-16 sm:py-24">
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">{t("Something went wrong", lang)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("An unexpected error occurred. Please try again.", lang)}
        </p>
        <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          {t("Try Again", lang)}
        </Button>
      </div>
    </div>
  );
}
