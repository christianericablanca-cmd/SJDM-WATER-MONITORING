import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

async function checkAdmin(request: Request): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.resolved !== true) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const adminSupabase = createServiceClient();
  const { error } = await adminSupabase
    .from("bug_reports")
    .update({ resolved: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
