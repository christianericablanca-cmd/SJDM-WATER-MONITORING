import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const identifier = getClientIdentifier(request);
  const { allowed } = await checkRateLimit(identifier, "list_announcements", 30, 1);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, content, source, is_official, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
