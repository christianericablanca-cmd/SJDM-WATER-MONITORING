import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request);
  const { allowed } = await checkRateLimit(identifier, "list_businesses", 60, 1);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("businesses")
    .select("name, category, address, barangay, contact, facebook, delivery_available, operating_hours, coverage_area, estimated_fee, photo_url, latitude, longitude")
    .eq("disabled", false)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
