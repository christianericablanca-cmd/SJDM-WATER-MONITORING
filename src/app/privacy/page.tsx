import { Shield } from "lucide-react";
import { t } from "@/lib/i18n";
import { cookies } from "next/headers";

export const metadata = {
  title: "Privacy Policy — WaterWatch SJDM",
};

export default async function PrivacyPage() {
  const lang = ((await cookies()).get("lang")?.value || "en") as "en" | "tl";

  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center">
          <Shield className="h-5 w-5 text-water" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("Privacy Policy", lang)}</h1>
          <p className="text-sm text-muted-foreground">{t("Last updated: July 2026.", lang)}</p>
        </div>
      </div>

      <div className="prose prose-sm sm:prose-base max-w-none space-y-4 text-sm sm:text-base text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">{t("1. Information We Collect", lang)}</h2>
        <p>{t("WaterWatch SJDM is designed to be anonymous. We collect the minimum data needed to operate:", lang)}</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>{t("Report data:", lang)}</strong>{t(" Barangay, issue type, description, photo (optional), and approximate timestamp. No name, email, phone, or account required.", lang)}</li>
           <li><strong>{t("Location data:", lang)}</strong>{t(" Approximate GPS coordinates are required for report submission. Precise address is never stored.", lang)}</li>
          <li><strong>{t("Session ID:", lang)}</strong>{t(" A random anonymous identifier stored in your browser to prevent abuse (rate limiting). Does not identify you personally.", lang)}</li>
          <li><strong>{t("Photo uploads:", lang)}</strong>{t(" Images you submit are stored in our Supabase bucket. We recommend removing faces, license plates, and personal identifiers before uploading.", lang)}</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">{t("2. How We Use Your Data", lang)}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("Display water issue reports on the community map", lang)}</li>
          <li>{t("Track report status (submitted → resolved)", lang)}</li>
          <li>{t("Prevent spam and abuse via rate limiting", lang)}</li>
          <li>{t("Aggregate anonymous statistics (e.g., &ldquo;X reports in Kaypian&rdquo;)", lang)}</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">{t("3. Data Sharing", lang)}</h2>
        <p>{t("We do not sell, rent, or share your data with third parties. Report data is displayed publicly on the map. We are not affiliated with Metro Pacific Bulacan Water or any government agency.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("4. Data Retention", lang)}</h2>
        <p>{t("Reports are retained indefinitely for community reference. Photos may be deleted periodically. You may request removal by contacting us through the platform.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("5. Third-Party Services", lang)}</h2>
        <p>{t("We use Supabase for database and file storage, and OpenStreetMap for map tiles. Each service has its own privacy policy.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("6. Children&apos;s Privacy", lang)}</h2>
        <p>{t("This platform is not directed at children under 13. We do not knowingly collect data from children.", lang)}</p>

        <h2 className="text-lg font-semibold text-foreground">{t("7. Changes to This Policy", lang)}</h2>
        <p>{t("We may update this policy. Continued use after changes constitutes acceptance.", lang)}</p>
      </div>
    </div>
  );
}