import { createServerSupabase } from "@/lib/supabase/server";
import { TrackReportContent } from "./track-report-content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrackReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let reportId = id.toUpperCase();
  if (/^\d+$/.test(id)) {
    reportId = `SJDM-WATER-${id.padStart(5, "0")}`;
  } else if (/^(?:SJDM-)?[A-Z0-9]+-[A-Z0-9]{5}$/i.test(id)) {
    const stripped = id.replace(/^SJDM-/i, "");
    reportId = `SJDM-${stripped.toUpperCase()}`;
  }

  const supabase = await createServerSupabase();
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("report_id_display", reportId)
    .single();

  if (!report) notFound();

  return <TrackReportContent report={report} reportId={reportId} />;
}
