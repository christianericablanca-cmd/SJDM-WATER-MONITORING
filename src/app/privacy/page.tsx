import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — WaterWatch SJDM",
};

export default function PrivacyPage() {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center">
          <Shield className="h-5 w-5 text-water" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>
      </div>

      <div className="prose prose-sm sm:prose-base max-w-none space-y-4 text-sm sm:text-base text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <p>WaterWatch SJDM is designed to be anonymous. We collect the minimum data needed to operate:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Report data:</strong> Barangay, issue type, description, photo (optional), and approximate timestamp. No name, email, phone, or account required.</li>
           <li><strong>Location data:</strong> Approximate GPS coordinates are required for report submission. Precise address is never stored.</li>
          <li><strong>Session ID:</strong> A random anonymous identifier stored in your browser to prevent abuse (rate limiting). Does not identify you personally.</li>
          <li><strong>Photo uploads:</strong> Images you submit are stored in our Supabase bucket. We recommend removing faces, license plates, and personal identifiers before uploading.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Display water issue reports on the community map</li>
          <li>Track report status (submitted → resolved)</li>
          <li>Prevent spam and abuse via rate limiting</li>
          <li>Aggregate anonymous statistics (e.g., "X reports in Kaypian")</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. Data Sharing</h2>
        <p>We do not sell, rent, or share your data with third parties. Report data is displayed publicly on the map. We are not affiliated with Metro Pacific Bulacan Water or any government agency.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Data Retention</h2>
        <p>Reports are retained indefinitely for community reference. Photos may be deleted periodically. You may request removal by contacting us through the platform.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Third-Party Services</h2>
        <p>We use Supabase for database and file storage, and OpenStreetMap for map tiles. Each service has its own privacy policy.</p>

        <h2 className="text-lg font-semibold text-foreground">6. Children&apos;s Privacy</h2>
        <p>This platform is not directed at children under 13. We do not knowingly collect data from children.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Changes to This Policy</h2>
        <p>We may update this policy. Continued use after changes constitutes acceptance.</p>
      </div>
    </div>
  );
}
