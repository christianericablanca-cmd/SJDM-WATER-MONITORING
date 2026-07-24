import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { generateReportId } from "@/lib/utils";
import type { WaterProvider } from "@/lib/types";
import { checkRateLimit, recordRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { sanitizeString, sanitizeHtml, isValidLat, isValidLng, isValidEnum, toSafeNumber } from "@/lib/sanitize";
import { BARANGAYS, ISSUE_TYPES, WATER_PROVIDERS, BOUNDARIES_SJDM } from "@/lib/constants";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const publicReports = data.map((r) => ({
    id: r.id,
    report_id_display: r.report_id_display,
    barangay: r.barangay,
    issue_type: r.issue_type,
    status: r.status,
    latitude: r.latitude,
    longitude: r.longitude,
    created_at: r.created_at,
    started_at: r.started_at,
    resolved_at: r.resolved_at,
  }));

  return NextResponse.json(publicReports);
}

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const body = await request.json();

  const identifier = getClientIdentifier(request);

  const { allowed, remaining } = await checkRateLimit(identifier);
  if (!allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Maximum 3 reports per hour. Please try again later.",
        remaining: 0,
        retryAfter: "1 hour",
      },
      { status: 429 },
    );
  }

  // Verify Turnstile captcha if site key is configured
  const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
  if (TURNSTILE_SECRET) {
    const token = body.captcha_token;
    if (!token) {
      return NextResponse.json({ error: "Captcha verification required" }, { status: 400 });
    }
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 403 });
    }
  }

  if (!body.barangay || !body.issue_type || !body.started_at) {
    return NextResponse.json(
      { error: "Missing required fields: barangay, issue_type, started_at" },
      { status: 400 },
    );
  }

  if (body.latitude == null || body.longitude == null) {
    return NextResponse.json(
      { error: "Location pin is required. Please allow location access or select a spot on the map." },
      { status: 400 },
    );
  }

  // Input validation and sanitization
  const barangay = sanitizeString(body.barangay, 50);
  const issueType = sanitizeString(body.issue_type, 30);

  if (!isValidEnum(barangay, BARANGAYS)) {
    return NextResponse.json({ error: "Invalid barangay" }, { status: 400 });
  }
  if (!isValidEnum(issueType, ISSUE_TYPES.map((t) => t.value))) {
    return NextResponse.json({ error: "Invalid issue type" }, { status: 400 });
  }

  const waterProvider = sanitizeString(body.water_provider || "", 20);
  if (!waterProvider || !isValidEnum(waterProvider, WATER_PROVIDERS.map((p) => p.value))) {
    return NextResponse.json({ error: "Please select a water provider" }, { status: 400 });
  }

  const lat = toSafeNumber(body.latitude);
  const lng = toSafeNumber(body.longitude);
  if (lat !== null && !isValidLat(lat)) {
    return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
  }
  if (lng !== null && !isValidLng(lng)) {
    return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
  }

  const description = body.description ? sanitizeHtml(body.description, 2000) : null;
  const streetSitio = body.street_sitio ? sanitizeString(body.street_sitio, 200) : null;
  const photoUrl = body.photo_url ? sanitizeString(body.photo_url, 500) : null;
  const startedAt = sanitizeString(body.started_at, 30);

  // Generate a unique random report ID (retry on collision)
  let reportId: string;
  let isUnique = false;
  let attempts = 0;
  do {
    reportId = generateReportId(waterProvider as WaterProvider);
    const { data: existing } = await supabase
      .from("reports")
      .select("id")
      .eq("report_id_display", reportId)
      .maybeSingle();
    isUnique = !existing;
    attempts++;
    if (attempts > 10) {
      return NextResponse.json({ error: "Could not generate unique ID. Please try again." }, { status: 500 });
    }
  } while (!isUnique);

  // Try re-activating a matching stale report (same GPS ±~111m + barangay + issue)
  let reactivated: { id: string; report_id_display: string } | null = null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (lat !== null && lng !== null) {
    const { data: match } = await supabase
      .from("reports")
      .update({
        status: "submitted",
        verified: false,
        denied: false,
        resolved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("barangay", barangay)
      .eq("issue_type", issueType)
      .in("status", ["stale", "resolved"])
      .gte("updated_at", thirtyDaysAgo)
      .gte("latitude", lat - 0.001)
      .lte("latitude", lat + 0.001)
      .gte("longitude", lng - 0.001)
      .lte("longitude", lng + 0.001)
      .select()
      .maybeSingle();
    if (match) reactivated = match;
  }

  let report;
  if (reactivated) {
    report = reactivated;
  } else {
    const { data: inserted, error } = await supabase
      .from("reports")
      .insert({
        barangay,
        latitude: lat ?? body.latitude,
        longitude: lng ?? body.longitude,
        issue_type: issueType,
        description,
        photo_url: photoUrl,
        started_at: startedAt,
        street_sitio: streetSitio,
        water_provider: waterProvider,
        report_id_display: reportId,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    report = inserted;
  }

  await recordRateLimit(identifier);

  const webhookUrl = process.env.ADMIN_NOTIFICATION_WEBHOOK;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "new_report",
        report_id: report.report_id_display,
        barangay: report.barangay,
        issue_type: report.issue_type,
        water_provider: report.water_provider,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        created_at: report.created_at,
      }),
    }).catch(() => {});
  }

  return NextResponse.json(
    { report_id_display: report.report_id_display, remaining: remaining - 1 },
    { status: 201 },
  );
}
