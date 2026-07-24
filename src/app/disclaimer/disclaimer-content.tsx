"use client";

import { AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";

export function DisclaimerContent() {
  const { lang } = useLanguage();

  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("Disclaimer", lang)}</h1>
          <p className="text-sm text-muted-foreground">{t("Last updated: July 2026", lang)}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
          <strong>{t("Important:", lang)}</strong>{t(" WaterWatch SJDM is an independent, community-built platform. We are not affiliated with Metro Pacific Bulacan Water (MPBW), the City Government of San Jose del Monte, or any government agency.", lang)}
        </div>

        <h2 className="text-lg font-semibold text-foreground">{t("1. Community-Sourced Information", lang)}</h2>
        <p>{t("All water issue reports displayed on this platform are submitted by community members. Reports undergo admin review before appearing on the public map to filter out unverified or false claims. However, we cannot guarantee 100% accuracy of every report.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("2. Not Official", lang)}</h2>
        <p>{t("This platform is not an official communication channel of Metro Pacific Bulacan Water, the LGU, or any government agency. Do not rely on this platform as your sole source of information during water emergencies. Always contact official hotlines for verified updates.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("3. No Guarantee of Accuracy", lang)}</h2>
        <p>{t("Report locations are based on user-submitted GPS data. Map pin placements represent the approximate reporting area and may not reflect exact addresses.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("4. Directory Listings", lang)}</h2>
        <p>{t("Business and service listings in the Assistance Directory are user-submitted or admin-added. We do not endorse or guarantee the quality, pricing, or availability of any listed service. Verify directly with the provider before availing services.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("5. Emergency Contacts", lang)}</h2>
        <p>{t("Emergency contact numbers are sourced from publicly available government websites. We recommend verifying numbers directly with the respective agencies, as contact details may change without notice.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("6. No Liability", lang)}</h2>
        <p>{t("WaterWatch SJDM, its contributors, and administrators are not liable for any damages, losses, or inconveniences arising from the use of this platform. Use at your own risk.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("7. External Links", lang)}</h2>
        <p>{t("This platform may contain links to third-party websites. We are not responsible for their content or privacy practices.", lang)}</p>
      </div>
    </div>
  );
}
