import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeString } from "@/lib/sanitize";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const DEFAULT_ROOM = "sjdm";
const MAX_MESSAGE_CHARS = 500;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const room = sanitizeString(url.searchParams.get("room") || DEFAULT_ROOM, 32) || DEFAULT_ROOM;
  const limitRaw = url.searchParams.get("limit");
  const beforeRaw = url.searchParams.get("before");

  const limit = Math.max(1, Math.min(100, Number(limitRaw) || 50));

  const svc = createServiceClient();
  let q = svc
    .from("chat_messages")
    .select("id, room, message, barangay, author_hash, author_label, deleted, created_at")
    .eq("room", room)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (beforeRaw) {
    const before = new Date(beforeRaw);
    if (!isNaN(before.getTime())) {
      q = q.lt("created_at", before.toISOString());
    }
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ room, messages: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  // Check if this user is blocked
  const svc = createServiceClient();
  const { data: block } = await svc
    .from("chat_blocks")
    .select("author_hash")
    .eq("author_hash", identifier)
    .maybeSingle();

  if (block) {
    return NextResponse.json({ error: "You are blocked from posting messages." }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(identifier, "chat_message", 6, 1);
  if (!allowed) {
    return NextResponse.json({ error: "Slow down. Please wait a bit before sending again." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const room = sanitizeString((body as any).room || DEFAULT_ROOM, 32) || DEFAULT_ROOM;
  const messageRaw = typeof (body as any).message === "string" ? (body as any).message : "";
  const message = sanitizeString(messageRaw, MAX_MESSAGE_CHARS);
  const barangay = typeof (body as any).barangay === "string" ? sanitizeString((body as any).barangay, 60) : null;
  const authorLabel = typeof (body as any).author_label === "string" ? sanitizeString((body as any).author_label, 40) : null;

  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const { data, error } = await svc
    .from("chat_messages")
    .insert({
      room,
      message,
      barangay,
      author_hash: identifier,
      author_label: authorLabel,
      deleted: false,
    })
    .select("id, room, message, barangay, author_hash, author_label, deleted, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, "chat_message");

  return NextResponse.json({ message: data }, { status: 201 });
}
