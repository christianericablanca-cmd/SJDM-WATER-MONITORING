import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: "stale",
      resolved_at: new Date().toISOString(),
    })
    .neq("status", "resolved")
    .neq("status", "stale")
    .lt("updated_at", sevenDaysAgo)
    .select("id, report_id_display, barangay");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    marked_stale: data?.length ?? 0,
    reports: data ?? [],
  });
}
