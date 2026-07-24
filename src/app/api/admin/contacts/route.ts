import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeString, isValidLat, isValidLng, toSafeNumber } from "@/lib/sanitize";

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

const VALID_CATEGORIES = ["water_provider", "government", "emergency"];

function safeLat(value: unknown): number | null {
  const n = toSafeNumber(value);
  return n !== null && isValidLat(n) ? n : null;
}

function safeLng(value: unknown): number | null {
  const n = toSafeNumber(value);
  return n !== null && isValidLng(n) ? n : null;
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
  const name = sanitizeString(body.name, 200);
  const category = sanitizeString(body.category, 50);
  if (!name || !category) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("emergency_contacts")
    .insert({
      name,
      category,
      phone: body.phone ? sanitizeString(body.phone, 50) : null,
      address: body.address ? sanitizeString(body.address, 300) : null,
      website: body.website ? sanitizeString(body.website, 200) : null,
      messenger: body.messenger ? sanitizeString(body.messenger, 200) : null,
      latitude: safeLat(body.latitude),
      longitude: safeLng(body.longitude),
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
    return NextResponse.json({ error: "Missing contact id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = sanitizeString(body.name, 200);
  if (body.category !== undefined) {
    const cleanCategory = sanitizeString(body.category, 50);
    if (!VALID_CATEGORIES.includes(cleanCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = cleanCategory;
  }
  if (body.phone !== undefined) updates.phone = body.phone ? sanitizeString(body.phone, 50) : null;
  if (body.address !== undefined) updates.address = body.address ? sanitizeString(body.address, 300) : null;
  if (body.website !== undefined) updates.website = body.website ? sanitizeString(body.website, 200) : null;
  if (body.messenger !== undefined) updates.messenger = body.messenger ? sanitizeString(body.messenger, 200) : null;
  if (body.latitude !== undefined) updates.latitude = safeLat(body.latitude);
  if (body.longitude !== undefined) updates.longitude = safeLng(body.longitude);

  const { data, error } = await svc
    .from("emergency_contacts")
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
    return NextResponse.json({ error: "Missing contact id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("emergency_contacts")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
