import { createServerSupabase } from "@/lib/supabase/server";
import { AnnouncementsContent } from "./announcements-content";

export const revalidate = 120;

export default async function AnnouncementsPage() {
  const supabase = await createServerSupabase();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return <AnnouncementsContent announcements={(announcements ?? [])} />;
}
