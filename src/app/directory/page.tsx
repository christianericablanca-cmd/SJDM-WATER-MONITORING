import { createServerSupabase } from "@/lib/supabase/server";
import { DirectoryContent } from "./directory-content";
import type { Business } from "@/lib/types";

export const revalidate = 300;

export default async function DirectoryPage() {
  const supabase = await createServerSupabase();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("disabled", false)
    .order("verified", { ascending: false })
    .order("name");

  return <DirectoryContent businesses={(businesses ?? []) as Business[]} />;
}
