import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkAdminRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await checkAdminRateLimit(request))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("confirm") !== "true") {
    return NextResponse.json({ error: "Confirmation required. Add ?confirm=true to proceed." }, { status: 400 });
  }

  const svc = createServiceClient();

  const { error: err1, count: c1 } = await svc.from("chat_messages").delete().neq("id", "0");
  const { error: err2, count: c2 } = await svc.from("chat_reports").delete().neq("id", "0");
  const { error: err3, count: c3 } = await svc.from("chat_blocks").delete().neq("id", "0");

  const failures: string[] = [];
  if (err1) failures.push("chat_messages");
  if (err2) failures.push("chat_reports");
  if (err3) failures.push("chat_blocks");

  if (failures.length > 0) {
    return NextResponse.json({ error: `Partial failure on: ${failures.join(", ")}` }, { status: 500 });
  }

  console.log(`Chat cleared by admin: ${c1 ?? 0} messages, ${c2 ?? 0} reports, ${c3 ?? 0} blocks`);

  return NextResponse.json({ success: true, deleted: { messages: c1 ?? 0, reports: c2 ?? 0, blocks: c3 ?? 0 } });
}
