import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

const COOLDOWN_HOURS = 24;

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const reportId = sanitizeString(body.report_id, 30);

  if (!reportId) {
    return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);
  const action = `reactivate:${reportId}`;
  const since = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

  // Check per-report cooldown (once per 24h per identifier)
  const { data: recent } = await supabase
    .from("rate_limits")
    .select("created_at")
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recent && recent.length > 0) {
    const lastAttempt = new Date(recent[0].created_at).getTime();
    const nextAllowed = lastAttempt + COOLDOWN_HOURS * 60 * 60 * 1000;
    const remainingMs = nextAllowed - Date.now();
    const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
    const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return NextResponse.json(
      {
        error: `This report can only be reactivated once every ${COOLDOWN_HOURS}h. Try again in ${remainingHours}h ${remainingMinutes}m.`,
        cooldown: true,
        remainingMs,
      },
      { status: 429 },
    );
  }

  const { data: report, error: findError } = await supabase
    .from("reports")
    .select("id, status, report_id_display, barangay, issue_type")
    .eq("report_id_display", reportId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!report) {
    return NextResponse.json({ error: "Report not found. Check your Report ID and try again." }, { status: 404 });
  }

  if (report.status !== "stale" && report.status !== "resolved") {
    return NextResponse.json(
      { error: `This report is currently "${report.status.replace("_", " ")}" and cannot be reactivated. Only inactive or resolved reports can be reactivated.` },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: "submitted",
      verified: false,
      denied: false,
      resolved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (updateError) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, action);

  return NextResponse.json({
    success: true,
    report_id_display: report.report_id_display,
    barangay: report.barangay,
    issue_type: report.issue_type,
  });
}
