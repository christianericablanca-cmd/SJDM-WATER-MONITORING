import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
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
