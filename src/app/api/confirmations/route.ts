import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const reportId = sanitizeString(body.report_id || "", 64);
  if (!reportId) {
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
  const sessionHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionId)))).map((b) => b.toString(16).padStart(2, "0")).join("");

  const { error } = await supabase.from("report_confirmations").insert({
    report_id: reportId,
    session_id: sessionHash,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already confirmed" }, { status: 200 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, "confirm_report");

  return NextResponse.json({ success: true }, { status: 201 });
}
