"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";
import { BusinessClaimForm } from "@/components/directory/business-claim-form";
import { Building2 } from "lucide-react";

export function ClaimContent() {
  const { lang } = useLanguage();

  return (
    <div className="page-container py-6 sm:py-8 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-water-muted flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-water" />
        </div>
        <h1 className="section-title">{t("Submit a Service", lang)}</h1>
        <p className="section-subtitle mx-auto">
          {t("List your water-related service in our community directory. An admin will review your submission.", lang)}
        </p>
      </div>
      <BusinessClaimForm />
    </div>
  );
}
