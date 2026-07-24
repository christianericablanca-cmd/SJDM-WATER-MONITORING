import { createServerSupabase } from "@/lib/supabase/server";
import { EmergencyContent } from "./emergency-content";
import type { EmergencyContact } from "@/lib/types";

export const revalidate = 3600;

export default async function EmergencyPage() {
  const supabase = await createServerSupabase();
  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("*")
    .order("category")
    .order("name");

  return <EmergencyContent contacts={(contacts ?? []) as EmergencyContact[]} />;
}
