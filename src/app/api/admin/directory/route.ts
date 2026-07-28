import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { sanitizeString, isValidLat, isValidLng, isValidEnum, toSafeNumber } from "@/lib/sanitize";
import { BARANGAYS, BUSINESS_CATEGORIES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, category, address, barangay, contact, delivery_available, operating_hours, latitude, longitude, photo_url } = body;

  if (!name || !category || !address || !barangay) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cleanBarangay = sanitizeString(barangay, 50);
  const cleanCategory = sanitizeString(category, 50);
  if (!isValidEnum(cleanBarangay, BARANGAYS)) {
    return NextResponse.json({ error: "Invalid barangay" }, { status: 400 });
  }
  if (!isValidEnum(cleanCategory, BUSINESS_CATEGORIES.map((c) => c.value))) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const lat = toSafeNumber(latitude);
  const lng = toSafeNumber(longitude);
  if (lat !== null && !isValidLat(lat)) {
    return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
  }
  if (lng !== null && !isValidLng(lng)) {
    return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .insert({
      name: sanitizeString(name, 200),
      category: cleanCategory,
      address: sanitizeString(address, 300),
      barangay: cleanBarangay,
      contact: contact ? sanitizeString(contact, 100) : null,
      delivery_available: delivery_available ?? false,
      operating_hours: operating_hours ? sanitizeString(operating_hours, 500) : null,
      latitude: lat,
      longitude: lng,
      photo_url: photo_url || null,
      verified: true,
      disabled: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, category, address, barangay, contact, facebook, delivery_available, operating_hours, coverage_area, estimated_fee, latitude, longitude, photo_url } = body;

  if (!id || !name || !category || !address || !barangay) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cleanBarangay = sanitizeString(barangay, 50);
  const cleanCategory = sanitizeString(category, 50);
  if (!isValidEnum(cleanBarangay, BARANGAYS)) {
    return NextResponse.json({ error: "Invalid barangay" }, { status: 400 });
  }
  if (!isValidEnum(cleanCategory, BUSINESS_CATEGORIES.map((c) => c.value))) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const lat = toSafeNumber(latitude);
  const lng = toSafeNumber(longitude);
  if (lat !== null && !isValidLat(lat)) {
    return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
  }
  if (lng !== null && !isValidLng(lng)) {
    return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("businesses")
    .update({
      name: sanitizeString(name, 200),
      category: cleanCategory,
      address: sanitizeString(address, 300),
      barangay: cleanBarangay,
      contact: contact ? sanitizeString(contact, 100) : null,
      facebook: facebook ? sanitizeString(facebook, 500) : null,
      delivery_available: delivery_available ?? false,
      operating_hours: operating_hours ? sanitizeString(operating_hours, 500) : null,
      coverage_area: coverage_area ? sanitizeString(coverage_area, 500) : null,
      estimated_fee: estimated_fee ? sanitizeString(estimated_fee, 200) : null,
      latitude: lat,
      longitude: lng,
      photo_url: photo_url || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data);
}
