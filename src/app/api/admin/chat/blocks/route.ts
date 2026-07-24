import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("chat_blocks")
    .select("author_hash, notes, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const authorHash = typeof body.author_hash === "string" ? body.author_hash.trim() : "";
  if (!authorHash) {
    return NextResponse.json({ error: "Missing author_hash" }, { status: 400 });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : null;

  const svc = createServiceClient();
  const { error } = await svc.from("chat_blocks").insert({
    author_hash: authorHash,
    notes: notes || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already blocked" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const authorHash = url.searchParams.get("author_hash");
  if (!authorHash) {
    return NextResponse.json({ error: "Missing author_hash" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("chat_blocks")
    .delete()
    .eq("author_hash", authorHash);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
