import { createServerSupabase } from "@/lib/supabase/server";
import { AnnouncementsContent } from "./announcements-content";

export const revalidate = 120;
const PAGE_SIZE = 12;

export default async function AnnouncementsPage() {
  const supabase = await createServerSupabase();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  const { count } = await supabase
    .from("announcements")
    .select("*", { count: "exact", head: true });

  return (
    <AnnouncementsContent
      announcements={(announcements ?? [])}
      total={count ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
