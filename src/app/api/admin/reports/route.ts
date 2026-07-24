import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("reports")
    .update({ verified: true, denied: false, status: "approved", updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select()
    .single();

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
  if (!body.id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("reports")
    .update({ denied: true, verified: false, status: "denied", denied_reason: body.denied_reason || null, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const svc = createServiceClient();

  // Delete photo from storage if it exists
  if (body.deletePhotoOnly) {
    const { data: report } = await svc
      .from("reports")
      .select("photo_url")
      .eq("id", body.id)
      .single();

    if (report?.photo_url) {
      const path = report.photo_url.split("/").pop();
      if (path) {
        await svc.storage.from("report-photos").remove([path]);
      }
    }

    const { error: updateError } = await svc
      .from("reports")
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Delete the entire report
  const { data: report } = await svc
    .from("reports")
    .select("photo_url")
    .eq("id", body.id)
    .single();

  if (report?.photo_url) {
    const path = report.photo_url.split("/").pop();
    if (path) {
      await svc.storage.from("report-photos").remove([path]);
    }
  }

  const { error: deleteError } = await svc
    .from("reports")
    .delete()
    .eq("id", body.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
