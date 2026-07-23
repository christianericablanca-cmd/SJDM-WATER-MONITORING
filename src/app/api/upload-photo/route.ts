import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

async function validateImageMagicBytes(file: File): Promise<boolean> {
  const headerSize = 12;
  const buffer = new Uint8Array(await file.slice(0, headerSize).arrayBuffer());
  const allowed = MAGIC_BYTES[file.type] || [];
  return allowed.some((magic) => magic.every((b, i) => buffer[i] === b));
}

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
    return NextResponse.json({ error: "File too large. Maximum 2MB." }, { status: 400 });
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." }, { status: 400 });
  }

  const isValid = await validateImageMagicBytes(file);
  if (!isValid) {
    return NextResponse.json({ error: "File content does not match the declared type. Tampered file rejected." }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("report-photos")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("report-photos").getPublicUrl(fileName);

  await recordRateLimit(identifier, "upload_photo");

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}
