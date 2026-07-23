import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ISSUE_TYPES, WATER_PROVIDERS } from "@/lib/constants";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    await createAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  const validProviders = WATER_PROVIDERS.map((p) => p.value) as string[];
  if (provider && provider !== "all" && !validProviders.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const svc = createServiceClient();
  let query = svc.from("reports").select("*").eq("verified", true).neq("status", "resolved").order("barangay", { ascending: true }).order("created_at", { ascending: false });

  if (provider && provider !== "all") {
    query = query.eq("water_provider", provider);
  }

  const { data: reports, error } = await query.limit(5000);

  if (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const reportList = reports ?? [];

  const providerLabel = (v: string) => WATER_PROVIDERS.find((p) => p.value === v)?.label || v;
  const issueLabel = (v: string) => ISSUE_TYPES.find((t) => t.value === v)?.label || v;
  const statusLabel: Record<string, string> = {
    submitted: "Submitted", under_review: "Under Review", approved: "Approved", denied: "Denied",
    resolved: "Resolved", stale: "Inactive",
  };
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("en-PH") : "";

  // Summary: per-barangay counts
  const barangayCounts: Record<string, number> = {};
  for (const r of reportList) {
    barangayCounts[r.barangay] = (barangayCounts[r.barangay] || 0) + 1;
  }
  const sortedBarangays = Object.keys(barangayCounts).sort();

  const summaryData = [
    ["Barangay", "Count"],
    ...sortedBarangays.map((b) => [b, barangayCounts[b]]),
    ["Overall Total", reportList.length],
  ];

  const detailData = reportList.map((r) => [
    r.report_id_display,
    r.barangay,
    r.street_sitio || "",
    issueLabel(r.issue_type),
    r.description || "",
    statusLabel[r.status] || r.status,
    providerLabel(r.water_provider),
    r.verified ? "Yes" : "No",
    r.denied ? "Yes" : "No",
    fmt(r.started_at),
    fmt(r.created_at),
    fmt(r.resolved_at),
    r.latitude ?? "",
    r.longitude ?? "",
    r.confirmation_count ?? 0,
  ]);

  const detailHeaders = ["ID", "Barangay", "Street/Sitio", "Issue", "Description", "Status", "Water Provider", "Verified", "Denied", "Started", "Reported", "Resolved", "Latitude", "Longitude", "Confirmations"];

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [
    { wch: 22 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Detailed reports sheet
  const detailWs = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);
  detailWs["!cols"] = detailHeaders.map((h, i) => {
    const maxLen = [h, ...detailData.map((r) => String(r[i] ?? ""))].reduce((max, v) => Math.max(max, String(v).length), 0);
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) };
  });
  XLSX.utils.book_append_sheet(wb, detailWs, "Detailed Reports");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=waterwatch_reports_${new Date().toISOString().slice(0, 10)}.xlsx`,
    },
  });
}
