import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      await svc.from("businesses").insert({
        name: claim.name, category: claim.category, address: claim.address, barangay: claim.barangay,
        contact: claim.contact, facebook: claim.facebook, delivery_available: claim.delivery_available,
        operating_hours: claim.operating_hours, coverage_area: claim.coverage_area, estimated_fee: claim.estimated_fee,
        latitude: claim.latitude, longitude: claim.longitude, photo_url: claim.photo_url, verified: false,
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
