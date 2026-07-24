import { FileText } from "lucide-react";
import { t } from "@/lib/i18n";
import { cookies } from "next/headers";

export const metadata = {
  title: "Terms of Service — WaterWatch SJDM",
};

export default async function TermsPage() {
  const lang = ((await cookies()).get("lang")?.value || "en") as "en" | "tl";

  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center">
          <FileText className="h-5 w-5 text-water" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("Terms of Service", lang)}</h1>
          <p className="text-sm text-muted-foreground">{t("Last updated: July 2026", lang)}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">{t("1. Acceptance of Terms", lang)}</h2>
        <p>{t("By using WaterWatch SJDM, you agree to these terms. If you do not agree, do not use the platform.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("2. Community Guidelines", lang)}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{t("Be truthful:", lang)}</strong>{t(" Only report real water issues you are experiencing.", lang)}</li>
          <li><strong>{t("No false reports:", lang)}</strong>{t(" Submitting fake or malicious reports is prohibited.", lang)}</li>
          <li><strong>{t("Respect privacy:", lang)}</strong>{t(" Do not include personal information (names, phone numbers, etc.) in reports or photos.", lang)}</li>
          <li><strong>{t("One report per issue:", lang)}</strong>{t(" Duplicate reports for the same issue may be merged.", lang)}</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">{t("3. Prohibited Conduct", lang)}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Submitting false, misleading, or fraudulent reports", lang)}</li>
          <li>{t("Attempting to abuse, spam, or disrupt the platform", lang)}</li>
          <li>{t("Using the platform for commercial solicitation", lang)}</li>
          <li>{t("Posting offensive, discriminatory, or illegal content", lang)}</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">{t("4. Account Termination", lang)}</h2>
        <p>{t("We reserve the right to remove reports or ban users who violate these terms, without notice.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("5. Limitation of Liability", lang)}</h2>
        <p>{t("WaterWatch SJDM is provided &quot;as is.&quot; We are not responsible for the accuracy of community-submitted reports, nor for any actions taken based on them. We are not affiliated with Metro Pacific Bulacan Water or any government agency.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("6. Changes to Terms", lang)}</h2>
        <p>{t("We may update these terms. Continued use after changes constitutes acceptance.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("7. Governing Law", lang)}</h2>
        <p>{t("These terms are governed by the laws of the Republic of the Philippines.", lang)}</p>
      </div>
    </div>
  );
}