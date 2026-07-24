import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();
  const description = sanitizeString(body.description, 2000);
  const page = sanitizeString(body.page || "", 200);

  if (!description || description.length < 10) {
    return NextResponse.json({ error: "Please describe the issue (min 10 characters)." }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);
  const { allowed } = await checkRateLimit(identifier, "bug_report", 5, 24 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many submissions. Try again tomorrow." }, { status: 429 });
  }

  const { error } = await supabase.from("bug_reports").insert({
    description,
    page: page || null,
    identifier,
  });

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, "bug_report");

  return NextResponse.json({ success: true });
}
