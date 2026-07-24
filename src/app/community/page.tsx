import { createServerSupabase } from "@/lib/supabase/server";
import { CommunityContent } from "./community-content";

export const revalidate = 30;

export default async function CommunityPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("chat_messages")
    .select("id, room, message, barangay, author_hash, author_label, deleted, created_at")
    .eq("room", "sjdm")
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  // Render oldest-first for chat UI.
  const initial = (data ?? []).slice().reverse();

  return <CommunityContent initialMessages={initial} />;
}
