import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — WaterWatch SJDM",
};

export default function TermsPage() {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-water-muted flex items-center justify-center">
          <FileText className="h-5 w-5 text-water" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        </div>
      </div>

      <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By using WaterWatch SJDM, you agree to these terms. If you do not agree, do not use the platform.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Community Guidelines</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Be truthful:</strong> Only report real water issues you are experiencing.</li>
          <li><strong>No false reports:</strong> Submitting fake or malicious reports is prohibited.</li>
          <li><strong>Respect privacy:</strong> Do not include personal information (names, phone numbers, etc.) in reports or photos.</li>
          <li><strong>One report per issue:</strong> Duplicate reports for the same issue may be merged.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. Prohibited Conduct</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Submitting false, misleading, or fraudulent reports</li>
          <li>Attempting to abuse, spam, or disrupt the platform</li>
          <li>Using the platform for commercial solicitation</li>
          <li>Posting offensive, discriminatory, or illegal content</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">4. Account Termination</h2>
        <p>We reserve the right to remove reports or ban users who violate these terms, without notice.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Limitation of Liability</h2>
        <p>WaterWatch SJDM is provided &quot;as is.&quot; We are not responsible for the accuracy of community-submitted reports, nor for any actions taken based on them. We are not affiliated with Metro Pacific Bulacan Water or any government agency.</p>

        <h2 className="text-lg font-semibold text-foreground">6. Changes to Terms</h2>
        <p>We may update these terms. Continued use after changes constitutes acceptance.</p>

        <h2 className="text-lg font-semibold text-foreground">7. Governing Law</h2>
        <p>These terms are governed by the laws of the Republic of the Philippines.</p>
      </div>
    </div>
  );
}
