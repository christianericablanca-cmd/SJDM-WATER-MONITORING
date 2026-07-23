import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createAdminSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    marked_stale: data?.length ?? 0,
    reports: data ?? [],
  });
}
