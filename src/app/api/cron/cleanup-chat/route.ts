import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data, error } = await svc
    .from("chat_messages")
    .update({ deleted: true })
    .lt("created_at", cutoff)
    .eq("deleted", false)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ deleted: data?.length ?? 0 });
}
