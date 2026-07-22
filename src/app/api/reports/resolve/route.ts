import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const reportId = sanitizeString(body.report_id, 30);

  if (!reportId) {
    return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);

  const { allowed } = await checkRateLimit(identifier, "resolve_report", 3, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 3 resolves per hour." },
      { status: 429 },
    );
  }

  const { data: report, error: findError } = await supabase
    .from("reports")
    .select("id, status, report_id_display")
    .eq("report_id_display", reportId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (report.status === "resolved" || report.status === "stale") {
    return NextResponse.json(
      { error: "This report is already resolved or inactive." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await recordRateLimit(identifier, "resolve_report");

  return NextResponse.json({ success: true, report_id_display: report.report_id_display });
}
