import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing message id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("chat_messages")
    .update({ deleted: true })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(200, Number(limitRaw) || 100));

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("chat_messages")
    .select("id, room, message, barangay, author_hash, author_label, deleted, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}
