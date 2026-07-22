import { BusinessClaimForm } from "@/components/directory/business-claim-form";
import { Building2 } from "lucide-react";

export default function ClaimPage() {
  return (
    <div className="page-container py-6 sm:py-8 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-water-muted flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-water" />
        </div>
        <h1 className="section-title">Submit Your Business</h1>
        <p className="section-subtitle mx-auto">
          Add your water-related business to our community directory. Free listing — an admin will review your submission.
        </p>
      </div>
      <BusinessClaimForm />
    </div>
  );
}
