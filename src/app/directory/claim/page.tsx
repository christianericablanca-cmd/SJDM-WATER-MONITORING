import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import { BusinessClaimForm } from "@/components/directory/business-claim-form";
import { Building2 } from "lucide-react";

export default async function ClaimPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "tl";

  return (
    <div className="page-container py-6 sm:py-8 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-water-muted flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-water" />
        </div>
        <h1 className="section-title">{t("Submit Your Business", lang)}</h1>
        <p className="section-subtitle mx-auto">
          {t("Add your water-related business to our community directory. Free listing — an admin will review your submission.", lang)}
        </p>
      </div>
      <BusinessClaimForm />
    </div>
  );
}
