import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeString } from "@/lib/sanitize";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);
  const { allowed } = await checkRateLimit(identifier, "chat_report", 10, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const messageId = typeof (body as any).message_id === "string" ? (body as any).message_id : "";
  const reasonRaw = typeof (body as any).reason === "string" ? (body as any).reason : "";
  const reason = sanitizeString(reasonRaw, 200);
  if (!messageId) {
    return NextResponse.json({ error: "Missing message_id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("chat_reports").insert({
    message_id: messageId,
    reason: reason || null,
    reporter_hash: identifier,
  });

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, "chat_report");
  return NextResponse.json({ ok: true }, { status: 201 });
}
