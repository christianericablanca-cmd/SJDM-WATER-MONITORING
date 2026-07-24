import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString, isValidLat, isValidLng, isValidEnum, toSafeNumber } from "@/lib/sanitize";
import { BARANGAYS, BUSINESS_CATEGORIES } from "@/lib/constants";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

async function verifyCaptcha(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  if (!body.name || !body.category || !body.address || !body.barangay) {
    return NextResponse.json(
      { error: "Missing required fields: name, category, address, barangay" },
      { status: 400 },
    );
  }

  const identifier = getClientIdentifier(request);

  const { allowed } = await checkRateLimit(identifier, "claim_business", 2, 24 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Maximum 2 submissions per day" }, { status: 429 });
  }

  const captchaToken = body.captcha_token;
  if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
    return NextResponse.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  const cleanBarangay = sanitizeString(body.barangay, 50);
  const cleanCategory = sanitizeString(body.category, 50);
  if (!isValidEnum(cleanBarangay, BARANGAYS)) {
    return NextResponse.json({ error: "Invalid barangay" }, { status: 400 });
  }
  if (!isValidEnum(cleanCategory, BUSINESS_CATEGORIES.map((c) => c.value))) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const sessionCookie = request.headers.get("cookie") || "";
  const sessionMatch = sessionCookie.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch?.[1] || identifier;

  const lat = (() => {
    const n = toSafeNumber(body.latitude);
    return n !== null && isValidLat(n) ? n : null;
  })();
  const lng = (() => {
    const n = toSafeNumber(body.longitude);
    return n !== null && isValidLng(n) ? n : null;
  })();

  const { data, error } = await supabase.from("business_claims").insert({
    name: sanitizeString(body.name, 200),
    category: cleanCategory,
    address: sanitizeString(body.address, 300),
    barangay: cleanBarangay,
    contact: body.contact ? sanitizeString(body.contact, 100) : null,
    facebook: body.facebook ? sanitizeString(body.facebook, 200) : null,
    delivery_available: body.delivery_available || false,
    operating_hours: body.operating_hours ? sanitizeString(body.operating_hours, 500) : null,
    coverage_area: body.coverage_area ? sanitizeString(body.coverage_area, 500) : null,
    estimated_fee: body.estimated_fee ? sanitizeString(body.estimated_fee, 100) : null,
    latitude: lat,
    longitude: lng,
    photo_url: body.photo_url ? sanitizeString(body.photo_url, 500) : null,
    submitted_by_session: sessionId,
    status: "pending",
  }).select().single();

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  await recordRateLimit(identifier, "claim_business");

  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
