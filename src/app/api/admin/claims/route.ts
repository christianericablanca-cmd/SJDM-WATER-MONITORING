import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Barangay } from "@/lib/types";

// Fallback coordinates from src/lib/constants.ts (barangay centers)
const BARANGAY_COORDS: Partial<Record<Barangay, { lat: number; lng: number }>> = {
  "Santo Cristo": { lat: 14.828, lng: 121.032 },
  Assumption: { lat: 14.814, lng: 121.045 },
  "Bagong Buhay": { lat: 14.823, lng: 121.038 },
  Citrus: { lat: 14.806, lng: 121.052 },
  "Ciudad Real": { lat: 14.788, lng: 121.058 },
  "Dulong Bayan": { lat: 14.819, lng: 121.047 },
  Fatima: { lat: 14.799, lng: 121.055 },
  "Francisco Homes-Guijo": { lat: 14.808, lng: 121.057 },
  "Francisco Homes-Mulawin": { lat: 14.805, lng: 121.059 },
  "Francisco Homes-Narra": { lat: 14.810, lng: 121.056 },
  "Francisco Homes-Yakal": { lat: 14.802, lng: 121.060 },
  "Gaya-gaya": { lat: 14.825, lng: 121.042 },
  Graceville: { lat: 14.830, lng: 121.030 },
  "Gumaoc Central": { lat: 14.820, lng: 121.040 },
  "Gumaoc East": { lat: 14.822, lng: 121.043 },
  "Gumaoc West": { lat: 14.818, lng: 121.038 },
  Kaybanban: { lat: 14.815, lng: 121.044 },
  Kaypian: { lat: 14.828, lng: 121.036 },
  "Lawang Pari": { lat: 14.812, lng: 121.049 },
  Maharlika: { lat: 14.817, lng: 121.041 },
  Minuyan: { lat: 14.810, lng: 121.048 },
  "Minuyan II": { lat: 14.807, lng: 121.050 },
  "Minuyan III": { lat: 14.809, lng: 121.049 },
  "Minuyan IV": { lat: 14.808, lng: 121.051 },
  "Minuyan V": { lat: 14.811, lng: 121.047 },
  Muzon: { lat: 14.824, lng: 121.035 },
  "Muzon East": { lat: 14.826, lng: 121.037 },
  "Muzon South": { lat: 14.822, lng: 121.033 },
  "Muzon West": { lat: 14.823, lng: 121.031 },
  "Paradise III": { lat: 14.804, lng: 121.054 },
  Poblacion: { lat: 14.814, lng: 121.045 },
  "Poblacion I": { lat: 14.813, lng: 121.046 },
  "St. Martin de Porres": { lat: 14.800, lng: 121.053 },
  "Sapang Palay": { lat: 14.820, lng: 121.036 },
  "San Isidro": { lat: 14.816, lng: 121.043 },
  "San Manuel": { lat: 14.821, lng: 121.034 },
  "San Martin": { lat: 14.819, lng: 121.039 },
  "San Pedro": { lat: 14.825, lng: 121.033 },
  "San Rafael": { lat: 14.827, lng: 121.031 },
  "San Roque": { lat: 14.813, lng: 121.047 },
  "Sta. Cruz": { lat: 14.811, lng: 121.050 },
  "Sto. Niño": { lat: 14.806, lng: 121.052 },
  "Sto. Niño II": { lat: 14.805, lng: 121.053 },
  "Tungkong Mangga": { lat: 14.829, lng: 121.029 },
};

export async function GET() {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_claims")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { claim_id, action } = body;

  if (!claim_id || !["approved", "rejected", "disable", "enable"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: claim } = await svc
    .from("business_claims")
    .select("*")
    .eq("id", claim_id)
    .single();

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  if (action === "approved" && claim.status === "approved") {
    return NextResponse.json({ error: "Claim is already approved" }, { status: 400 });
  }
  if (action === "rejected" && claim.status === "rejected") {
    return NextResponse.json({ error: "Claim is already rejected" }, { status: 400 });
  }

  if (action === "approved") {
    const { data: existing } = await svc.from("businesses").select("id").match({ name: claim.name, barangay: claim.barangay }).maybeSingle();
    if (!existing) {
      const barCoords = BARANGAY_COORDS[claim.barangay as Barangay];
      await svc.from("businesses").insert({
        name: claim.name, category: claim.category, address: claim.address, barangay: claim.barangay,
        contact: claim.contact, facebook: claim.facebook, delivery_available: claim.delivery_available,
        operating_hours: claim.operating_hours, coverage_area: claim.coverage_area, estimated_fee: claim.estimated_fee,
        latitude: claim.latitude ?? barCoords?.lat ?? null,
        longitude: claim.longitude ?? barCoords?.lng ?? null,
        photo_url: claim.photo_url, verified: true,
      });
    }
  } else if (action === "rejected") {
    await svc.from("businesses").delete().match({ name: claim.name, barangay: claim.barangay });
  } else if (action === "disable") {
    await svc.from("businesses").update({ disabled: true }).match({ name: claim.name, barangay: claim.barangay });
  } else if (action === "enable") {
    await svc.from("businesses").update({ disabled: false }).match({ name: claim.name, barangay: claim.barangay });
  }

  if (action === "approved" || action === "rejected") {
    const newStatus = action === "approved" ? "approved" : "rejected";
    const { error } = await svc
      .from("business_claims")
      .update({ status: newStatus })
      .eq("id", claim_id);

    if (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
