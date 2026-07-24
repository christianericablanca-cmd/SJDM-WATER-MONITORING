import { BookOpen } from "lucide-react";
import { t } from "@/lib/i18n";
import { cookies } from "next/headers";

export const metadata = {
  title: "How to Use — WaterWatch SJDM",
};

export default async function HowToUsePage() {
  const lang = ((await cookies()).get("lang")?.value || "en") as "en" | "tl";

  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-water" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("How to Use WaterWatch SJDM", lang)}</h1>
          <p className="text-sm text-muted-foreground">{t("A simple guide to reporting, tracking, and understanding water issues in your community.", lang)}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">{t("[howto] 1. Submit a Report", lang)}</h2>
        <p>{t("[howto] Click Submit Report and fill out the form. Select your barangay, place a pin on the map, choose the issue type, and optionally attach a photo. No personal information needed.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("[howto] 2. Get a Report ID", lang)}</h2>
        <p>{t("[howto] After submission, you will receive a unique Report ID. Save this — it is the only way to track your report later.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("[howto] 3. Track Your Report", lang)}</h2>
        <p>{t("[howto] Use your Report ID on the Submit Report page to check the status. Reports go through: Pending Review, Verified, In Progress, Resolved, or Denied.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("[howto] 4. View the Map", lang)}</h2>
        <p>{t("[howto] The Water Map shows all verified reports. Each pin represents a water issue in a barangay. Click a pin to see details and the current status.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("[howto] 5. Emergency Contacts", lang)}</h2>
        <p>{t("[howto] If you have a water emergency, call the official hotlines listed on the Emergency page. Do not use this platform for urgent situations.", lang)}</p>

        <div className="p-4 bg-water/5 border border-water/20 rounded-xl mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">{t("[howto] Tips for Effective Reporting", lang)}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("[howto] Be specific in your description — include how long the issue has been happening and what area is affected.", lang)}</li>
            <li>{t("[howto] Upload a photo if possible — it helps admins verify the issue faster.", lang)}</li>
            <li>{t("[howto] One report per issue — avoid submitting duplicate reports for the same problem.", lang)}</li>
            <li>{t("[howto] Keep your Report ID safe — without it, you cannot track or follow up on your report.", lang)}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
