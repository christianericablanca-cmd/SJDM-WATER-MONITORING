import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_claims")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { claim_id, action } = body;

  if (!claim_id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const svc = createServiceClient();

  if (action === "approved") {
    const { data: claim } = await svc
      .from("business_claims")
      .select("*")
      .eq("id", claim_id)
      .single();

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    await svc.from("businesses").insert({
      name: claim.name,
      category: claim.category,
      address: claim.address,
      barangay: claim.barangay,
      contact: claim.contact,
      facebook: claim.facebook,
      delivery_available: claim.delivery_available,
      operating_hours: claim.operating_hours,
      coverage_area: claim.coverage_area,
      estimated_fee: claim.estimated_fee,
      latitude: claim.latitude,
      longitude: claim.longitude,
      photo_url: claim.photo_url,
      verified: false,
    });
  }

  const { error } = await svc
    .from("business_claims")
    .update({ status: action })
    .eq("id", claim_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
