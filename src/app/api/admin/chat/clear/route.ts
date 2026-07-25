import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();

  const { error: err1 } = await svc.from("chat_messages").delete().neq("id", "0");
  const { error: err2 } = await svc.from("chat_reports").delete().neq("id", "0");
  const { error: err3 } = await svc.from("chat_blocks").delete().neq("id", "0");

  if (err1 || err2 || err3) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
