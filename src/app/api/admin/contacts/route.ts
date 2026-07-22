import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

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

export async function POST(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.name || !body.category) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("emergency_contacts")
    .insert({
      name: body.name,
      category: body.category,
      phone: body.phone || null,
      address: body.address || null,
      website: body.website || null,
      messenger: body.messenger || null,
      latitude: body.latitude ? parseFloat(body.latitude) : null,
      longitude: body.longitude ? parseFloat(body.longitude) : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing contact id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.category !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = body.category;
  }
  if (body.phone !== undefined) updates.phone = body.phone || null;
  if (body.address !== undefined) updates.address = body.address || null;
  if (body.website !== undefined) updates.website = body.website || null;
  if (body.messenger !== undefined) updates.messenger = body.messenger || null;
  if (body.latitude !== undefined) updates.latitude = body.latitude ? parseFloat(body.latitude) : null;
  if (body.longitude !== undefined) updates.longitude = body.longitude ? parseFloat(body.longitude) : null;

  const { data, error } = await svc
    .from("emergency_contacts")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const user = await checkAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
