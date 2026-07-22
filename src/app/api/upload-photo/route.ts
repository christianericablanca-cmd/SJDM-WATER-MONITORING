import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const identifier = getClientIdentifier(request);

  const { allowed } = await checkRateLimit(identifier, "upload_photo", 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Maximum 5 uploads per hour." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("report-photos")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(fileName);

  await recordRateLimit(identifier, "upload_photo");

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}
