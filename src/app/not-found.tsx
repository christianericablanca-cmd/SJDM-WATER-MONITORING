"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";

export default function NotFound() {
  const { lang } = useLanguage();

  return (
    <div className="page-container py-16 sm:py-24">
      <div className="max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <MapPin className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">{t("Page Not Found", lang)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("The page or report you are looking for does not exist.", lang)}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              {t("Home", lang)}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
