import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
  }

  let reportId = id.toUpperCase();
  if (!reportId.startsWith("SJDM-")) {
    reportId = /^\d+$/.test(id)
      ? `SJDM-WATER-${id.padStart(5, "0")}`
      : `SJDM-${id}`;
  }

  const supabase = createServiceClient();
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("report_id_display", reportId)
    .maybeSingle();

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: report.id,
    report_id_display: report.report_id_display,
    barangay: report.barangay,
    issue_type: report.issue_type,
    status: report.status,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    created_at: report.created_at,
    started_at: report.started_at,
    resolved_at: report.resolved_at,
    verified: report.verified,
    denied: report.denied,
    denied_reason: report.denied_reason,
    confirmation_count: report.confirmation_count,
  });
}
