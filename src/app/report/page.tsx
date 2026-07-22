import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import { ReportForm } from "@/components/reports/report-form";
import { TrackReportLookup } from "@/components/reports/track-report-lookup";
import { AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "tl";

  return (
    <div className="page-container py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="section-title">{t("Water Reports", lang)}</h1>
          <p className="section-subtitle mx-auto">
            {t("Report a water issue or track an existing report.", lang)}
          </p>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-water-muted flex items-center justify-center">
                  <Search className="h-4 w-4 text-water" />
                </div>
                <div>
                  <CardTitle className="text-sm">{t("Track a Report", lang)}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("Already have a Report ID? Check its status here.", lang)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrackReportLookup />
            </CardContent>
          </Card>

          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>{t("Reporting Rules", lang)}:</strong>{" "}
              {t("Reports must be truthful. Do not submit malicious information or upload private information about other people. False reports may be removed.", lang)}
            </div>
          </div>

          <ReportForm />
        </div>
      </div>
    </div>
  );
}
