import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeString, sanitizeHtml } from "@/lib/sanitize";

async function checkAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const title = sanitizeString(body.title, 200);
  const content = sanitizeHtml(body.content, 5000);
  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("announcements")
    .insert({
      title,
      content,
      source: sanitizeString(body.source, 100) || "WaterWatch SJDM",
      is_official: body.is_official ?? true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing announcement id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = sanitizeString(body.title, 200);
  if (body.content !== undefined) updates.content = sanitizeHtml(body.content, 5000);
  if (body.source !== undefined) updates.source = sanitizeString(body.source, 100);
  if (body.is_official !== undefined) updates.is_official = body.is_official;

  const { data, error } = await svc
    .from("announcements")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing announcement id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("announcements")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
