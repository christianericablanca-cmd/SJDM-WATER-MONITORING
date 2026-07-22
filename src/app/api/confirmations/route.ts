import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  if (!body.report_id) {
    return NextResponse.json({ error: "Missing report_id" }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);

  const { allowed } = await checkRateLimit(identifier, "confirm_report", 10, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const sessionCookie = request.headers.get("cookie") || "";
  const sessionMatch = sessionCookie.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch?.[1] || identifier;

  const { error } = await supabase.from("report_confirmations").insert({
    report_id: body.report_id,
    session_id: sessionId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already confirmed" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordRateLimit(identifier, "confirm_report");

  // Fetch updated report (trigger may have re-activated it)
  const { data: report } = await supabase
    .from("reports")
    .select("status, resolved_at")
    .eq("id", body.report_id)
    .single();

  return NextResponse.json({
    success: true,
    re_activated: report?.status !== "resolved" && report?.resolved_at === null,
  }, { status: 201 });
}
