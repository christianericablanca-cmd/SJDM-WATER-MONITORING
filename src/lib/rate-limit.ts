import { createServiceClient } from "./supabase/admin";

export async function checkRateLimit(
  identifier: string,
  action = "submit_report",
  maxRequests = 3,
  windowMinutes = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient();

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("created_at", since);

  const current = count ?? 0;
  const allowed = current < maxRequests;

  return { allowed, remaining: Math.max(0, maxRequests - current) };
}

export async function recordRateLimit(identifier: string, action = "submit_report") {
  const supabase = createServiceClient();
  await supabase.from("rate_limits").insert({
    identifier,
    action,
  });
}

export function getClientIdentifier(request: Request): string {
  const ip = request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  const cookieHeader = request.headers.get("cookie") || "";
  const sessionMatch = cookieHeader.match(/session_id=([^;]+)/);
  const sessionId = sessionMatch?.[1] || "unknown";

  // Fingerprint: combine IP + User-Agent + session cookie.
  // IP + UA is stable across cookie clears; session adds entropy.
  // Hash the raw string to keep stored identifiers compact.
  const raw = `${ip}|${userAgent}|${sessionId}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars.charAt(byte % chars.length)).join("");
}
