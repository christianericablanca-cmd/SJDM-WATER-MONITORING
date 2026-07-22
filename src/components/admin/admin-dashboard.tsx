"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatDate, timeSince } from "@/lib/utils";
import { ISSUE_TYPES, STATUS_LABELS, BARANGAYS, BUSINESS_CATEGORIES, WATER_PROVIDERS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WaterReport, Business, Announcement, ReportStatus } from "@/lib/types";
import {
  LogOut, MessageSquare, Building2, Megaphone, Loader2, FileText,
  CheckCircle, XCircle, Search, Shield, AlertCircle, Plus, Eye,
  ChevronRight, Clock, MapPin, Droplets, Phone, Truck, LayoutDashboard, Download, Bug,
  ChevronLeft,
} from "lucide-react";

interface BusinessClaim {
  id: string;
  name: string;
  category: string;
  address: string;
  barangay: string;
  contact: string | null;
  facebook: string | null;
  delivery_available: boolean;
  operating_hours: string | null;
  coverage_area: string | null;
  estimated_fee: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
}

interface Props {
  reports: WaterReport[];
  businesses: Business[];
  announcements: Announcement[];
  pendingCount: number;
  allClaims: BusinessClaim[];
  bugReports: { id: string; description: string; contact: string | null; page: string | null; created_at: string }[];
  totalReports: number;
  totalBusinesses: number;
  totalAnnouncements: number;
  pageSize: number;
  approvedCount: number;
  resolvedCount: number;
  deniedCount: number;
  verifiedBizCount: number;
}

type Tab = "dashboard" | "reports" | "claims" | "directory" | "announcements" | "bugs";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reports", label: "Reports", icon: MessageSquare },
  { key: "claims", label: "Claims", icon: FileText },
  { key: "directory", label: "Services", icon: Building2 },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "bugs", label: "Bugs", icon: Bug },
];

const CAT_LABEL: Record<string, string> = {
  water_refilling: "Water Refilling",
  mineral_water_delivery: "Mineral Water",
  water_tanker: "Water Tanker",
  laundry_services: "Laundry",
};

export function AdminDashboard({ reports, businesses, announcements, pendingCount, allClaims, bugReports, totalReports, totalBusinesses, totalAnnouncements, pageSize, approvedCount, resolvedCount, deniedCount, verifiedBizCount }: Props) {
  const pendingClaims = allClaims.filter((c) => c.status === "pending");
  const approvedClaims = allClaims.filter((c) => c.status === "approved");
  const rejectedClaims = allClaims.filter((c) => c.status === "rejected");
  const router = useRouter();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [tab, setTab] = useState<Tab>("reports");
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const reportPage = 0;
  const claimPage = 0;
  const servicePage = 0;
  const announcementPage = 0;

  // Filters
  const [providerFilter, setProviderFilter] = useState("all");
  // Export
  const [exportProvider, setExportProvider] = useState("all");
  const [exporting, setExporting] = useState(false);

  // Sub-tabs
  const [reportSubTab, setReportSubTab] = useState<"new" | "approved" | "resolved" | "denied">("new");
  const [claimSubTab, setClaimSubTab] = useState<"new" | "approved" | "rejected">("new");
  const [serviceSubTab, setServiceSubTab] = useState<"verified" | "community">("verified");

  // Detail dialogs
  const [viewReport, setViewReport] = useState<WaterReport | null>(null);
  const [viewClaim, setViewClaim] = useState<BusinessClaim | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [denyingId, setDenyingId] = useState<string | null>(null);

  // Add business dialog
  const [showAddBiz, setShowAddBiz] = useState(false);
  const [savingBiz, setSavingBiz] = useState(false);
  const [newBiz, setNewBiz] = useState({
    name: "", category: "", address: "", barangay: "",
    contact: "", delivery_available: false, operating_hours: "",
    latitude: "", longitude: "",
  });

  const supabase = createClient();

  const navigate = (params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    router.push(url.pathname + url.search);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearch("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportProvider !== "all") params.set("provider", exportProvider);
      const res = await fetch(`/api/admin/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `waterwatch_reports_${exportProvider === "all" ? "all" : exportProvider}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Exported", "Report data has been downloaded as Excel.");
    } catch {
      toastError("Export failed", "Could not export reports.");
    }
    setExporting(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleApprove = async (id: string) => {
    setUpdating(id);
    toastInfo("Approving report…");
    const res = await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toastSuccess("Report approved", "It is now visible on the map.");
      setViewReport(null);
      router.refresh();
    } else {
      const data = await res.json();
      toastError("Approval failed", data.error);
    }
    setUpdating(null);
  };

  const handleDeletePhoto = async (id: string) => {
    setUpdating(id);
    toastInfo("Deleting photo…");
    const res = await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, deletePhotoOnly: true }),
    });
    if (res.ok) {
      toastSuccess("Photo deleted", "The image has been removed.");
      setViewReport(null);
      router.refresh();
    } else {
      toastError("Delete failed", "Could not delete photo.");
    }
    setUpdating(null);
  };

  const handleDeny = async (id: string, reason?: string) => {
    setUpdating(id);
    toastInfo("Denying report…");
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, denied_reason: reason || null }),
    });
    if (res.ok) {
      toastSuccess("Report denied", "The report has been marked as denied.");
      setViewReport(null);
      setDenyingId(null);
      setDenyReason("");
      router.refresh();
    } else {
      toastError("Deny failed", "Could not deny the report.");
    }
    setUpdating(null);
  };

  const handleDeleteReport = useCallback(async (id: string) => {
    setUpdating(id);
    setConfirmDelete(null);
    toastInfo("Deleting report…");
    const res = await fetch("/api/admin/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toastSuccess("Report deleted", "The report has been removed.");
      setViewReport(null);
      router.refresh();
    } else {
      toastError("Delete failed", "Could not delete report.");
    }
    setUpdating(null);
  }, [router, toastInfo, toastSuccess, toastError]);

  const handleClaimAction = async (claimId: string, action: "approved" | "rejected") => {
    setUpdating(claimId);
    toastInfo(action === "approved" ? "Approving listing…" : "Rejecting listing…");
    const res = await fetch("/api/admin/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_id: claimId, action }),
    });
    if (res.ok) {
      toastSuccess(
        action === "approved" ? "Listing approved!" : "Listing rejected",
        action === "approved" ? "The business has been added to the directory." : "The claim has been rejected.",
      );
    } else {
      toastError("Action failed", "Could not process the claim. Please try again.");
    }
    router.refresh();
    setUpdating(null);
  };

  const handleCreateBusiness = async () => {
    if (!newBiz.name || !newBiz.category || !newBiz.address || !newBiz.barangay) {
      toastError("Missing fields", "Name, category, address, and barangay are required.");
      return;
    }
    setSavingBiz(true);
    try {
      const body: any = { ...newBiz };
      body.latitude = newBiz.latitude ? parseFloat(newBiz.latitude) : null;
      body.longitude = newBiz.longitude ? parseFloat(newBiz.longitude) : null;
      const res = await fetch("/api/admin/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");
      toastSuccess("Service added", `${newBiz.name} has been added to the directory.`);
      setShowAddBiz(false);
      setNewBiz({ name: "", category: "", address: "", barangay: "", contact: "", delivery_available: false, operating_hours: "", latitude: "", longitude: "" });
      router.refresh();
    } catch (err: any) {
      toastError("Failed to add", err.message);
    } finally {
      setSavingBiz(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (reportSubTab === "new") return (!r.verified && !r.denied) || (r.verified && r.status === "submitted");
    if (reportSubTab === "approved") return r.verified && r.status !== "resolved" && r.status !== "submitted";
    if (reportSubTab === "resolved") return r.status === "resolved";
    return r.denied;
  }).filter((r) =>
    (!search || r.report_id_display.toLowerCase().includes(search.toLowerCase()) || r.barangay.toLowerCase().includes(search.toLowerCase())) &&
    (providerFilter === "all" || r.water_provider === providerFilter)
  );

  const pendingReports = reports.filter((r) => (!r.verified && !r.denied) || (r.verified && r.status === "submitted"));

  const claimSource = claimSubTab === "new" ? pendingClaims : claimSubTab === "approved" ? approvedClaims : rejectedClaims;

  const filteredBiz = businesses.filter((b) => serviceSubTab === "verified" ? b.verified : !b.verified);

  const tabCounts: Record<string, string> = {
    reports: `${totalReports}`,
    claims: pendingClaims.length ? `${pendingClaims.length}` : "",
    directory: `${totalBusinesses}`,
    announcements: `${totalAnnouncements}`,
    bugs: bugReports.length ? `${bugReports.length}` : "",
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar */}
      <aside className={cn(
        "w-56 shrink-0 border-r bg-muted/20 hidden lg:flex flex-col",
        sidebarOpen ? "lg:flex" : "lg:hidden",
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-water flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">WaterWatch</p>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const count = tabCounts[t.key];
            const isActive = tab === t.key;
            return (
              <button key={t.key} onClick={() => switchTab(t.key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                  isActive ? "bg-water text-white shadow-sm font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t.label}</span>
                {count && (
                  <span className={cn(
                    "text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-2">
            <div className="text-[10px] text-muted-foreground space-y-0.5 px-1">
              <div className="flex justify-between"><span>Pending reports</span><span className="font-medium text-amber-600">{pendingReports.length}</span></div>
              <div className="flex justify-between"><span>Total reports</span><span className="font-medium">{totalReports}</span></div>
              <div className="flex justify-between"><span>Resolved</span><span className="font-medium text-emerald-600">{reports.filter((r) => r.status === "resolved").length}</span></div>
              <div className="flex justify-between"><span>Inactive</span><span className="font-medium text-muted-foreground">{reports.filter((r) => r.status === "stale").length}</span></div>
            </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full text-xs h-8 gap-1.5">
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile tabs bar */}
      <div className="flex lg:hidden w-full overflow-x-auto border-b gap-0 bg-muted/10">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0",
                tab === t.key ? "border-water text-water" : "border-transparent text-muted-foreground",
              )}>
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main work area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* === DASHBOARD TAB === */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-base sm:text-lg font-semibold">Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => switchTab("reports")}
                className="rounded-xl border p-5 text-left transition-all cursor-pointer hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium">Reports</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{totalReports}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">{pendingReports.length} pending</p>
              </button>
              <button onClick={() => switchTab("claims")}
                className="rounded-xl border p-5 text-left transition-all cursor-pointer hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">Claims</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{pendingClaims.length}</p>
              </button>
              <button onClick={() => switchTab("directory")}
                className="rounded-xl border p-5 text-left transition-all cursor-pointer hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Services</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{totalBusinesses}</p>
              </button>
              <button onClick={() => switchTab("announcements")}
                className="rounded-xl border p-5 text-left transition-all cursor-pointer hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-xs font-medium">Announcements</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{announcements.length}</p>
              </button>
            </div>
          </div>
        )}

        {/* === REPORTS TAB === */}
        {tab === "reports" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {(["new", "approved", "resolved", "denied"] as const).map((st) => (
                   <button key={st} onClick={() => { setReportSubTab(st); setSearch(""); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                      reportSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}>
                    {st === "new" ? `New (${pendingCount})`
                      : st === "approved" ? `Approved (${approvedCount})`
                      : st === "resolved" ? `Resolved (${resolvedCount})`
                      : `Denied (${deniedCount})`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); }}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {WATER_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-48 sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search ID or barangay…" value={search} onChange={(e) => { setSearch(e.target.value); }}
                    className="pl-8 h-8 text-xs" />
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border">
              <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground mr-1">Export:</span>
              <Select value={exportProvider} onValueChange={setExportProvider}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {WATER_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Excel
              </Button>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No reports found.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2.5 font-medium">ID</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Barangay</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Issue</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Provider</th>
                      <th className="text-left px-3 py-2.5 font-medium">Status</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Date</th>
                      <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y">
                     {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className="font-mono text-[11px] font-medium">{report.report_id_display}</span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs">{report.barangay}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-xs">
                            {ISSUE_TYPES.find((t) => t.value === report.issue_type)?.emoji}{" "}
                            {ISSUE_TYPES.find((t) => t.value === report.issue_type)?.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-[11px] text-muted-foreground">
                            {WATER_PROVIDERS.find((p) => p.value === report.water_provider)?.label || report.water_provider}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={
                            report.status === "resolved" || report.status === "approved" || (report.status === "under_review" && report.verified) ? "success" :
                            report.status === "denied" ? "destructive" :
                            report.status === "stale" ? "secondary" :
                            report.status === "community_confirmed" ? "warning" :
                            report.status === "under_review" ? "default" : "outline"
                          } className="text-[9px] px-1.5 py-0">
                            {(report.status === "under_review" && report.verified) ? STATUS_LABELS.approved : STATUS_LABELS[report.status] || report.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-[11px] text-muted-foreground">{timeSince(report.created_at)}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => setViewReport(report)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => setConfirmDelete(report.id)}
                              disabled={updating === report.id}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={reportPage} total={totalReports} pageSize={pageSize} onChange={(p) => navigate({ reportPage: String(p) })} />
          </div>
        )}

        {/* === CLAIMS TAB === */}
        {tab === "claims" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
              {(["new", "approved", "rejected"] as const).map((st) => {
                const count = st === "new" ? pendingClaims.length : st === "approved" ? approvedClaims.length : rejectedClaims.length;
                return (
                  <button key={st} onClick={() => { setClaimSubTab(st); }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                      claimSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}>
                    {st === "new" ? `New (${count})` : `${st} (${count})`}
                  </button>
                );
              })}
            </div>
            {claimSource.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No {claimSubTab} claims.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2.5 font-medium">Business</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Barangay</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Category</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Contact</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Submitted</th>
                      <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y">
                     {claimSource.map((claim) => (
                      <tr key={claim.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className="text-xs font-medium">{claim.name}</span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{claim.barangay}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground">{CAT_LABEL[claim.category] || claim.category}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-[11px] text-muted-foreground">{claim.contact || "—"}</span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-[11px] text-muted-foreground">{timeSince(claim.created_at)}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => setViewClaim(claim)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {claimSubTab === "new" && (
                              <>
                                <Button size="sm" className="h-7 text-[10px] px-2 bg-success hover:bg-success/90"
                                  onClick={() => handleClaimAction(claim.id, "approved")}
                                  disabled={updating === claim.id}>
                                  {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" /> Approve</>}
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2"
                                  onClick={() => handleClaimAction(claim.id, "rejected")}
                                  disabled={updating === claim.id}>
                                  {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" /> Reject</>}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={claimPage} total={allClaims.length} pageSize={pageSize} onChange={(p) => navigate({ claimPage: String(p) })} />
          </div>
        )}

        {/* === DIRECTORY TAB === */}
        {tab === "directory" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {(["verified", "community"] as const).map((st) => {
                  const count = st === "verified" ? verifiedBizCount : totalBusinesses - verifiedBizCount;
                  return (
                    <button key={st} onClick={() => { setServiceSubTab(st); }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                        serviceSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}>
                      {st === "verified" ? `Verified (${count})` : `Community (${count})`}
                    </button>
                  );
                })}
              </div>
              <Dialog open={showAddBiz} onOpenChange={setShowAddBiz}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-xs gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md">
                  <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <Label>Business Name *</Label>
                      <Input value={newBiz.name} onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category *</Label>
                      <Select value={newBiz.category} onValueChange={(v) => setNewBiz({ ...newBiz, category: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {BUSINESS_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address *</Label>
                      <Input value={newBiz.address} onChange={(e) => setNewBiz({ ...newBiz, address: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Barangay *</Label>
                      <Select value={newBiz.barangay} onValueChange={(v) => setNewBiz({ ...newBiz, barangay: v })}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select barangay" /></SelectTrigger>
                        <SelectContent>
                          {BARANGAYS.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact Number</Label>
                      <Input value={newBiz.contact} onChange={(e) => setNewBiz({ ...newBiz, contact: e.target.value })} className="h-9 text-sm" placeholder="e.g. 0917-xxx-xxxx" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Operating Hours</Label>
                      <Input value={newBiz.operating_hours} onChange={(e) => setNewBiz({ ...newBiz, operating_hours: e.target.value })} className="h-9 text-sm" placeholder="e.g. 6:00 AM - 8:00 PM" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label>Latitude</Label>
                        <Input value={newBiz.latitude} onChange={(e) => setNewBiz({ ...newBiz, latitude: e.target.value })} className="h-9 text-sm" placeholder="e.g. 14.7950" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Longitude</Label>
                        <Input value={newBiz.longitude} onChange={(e) => setNewBiz({ ...newBiz, longitude: e.target.value })} className="h-9 text-sm" placeholder="e.g. 121.0380" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground -mt-1">Get coordinates from Google Maps — right-click a location and select the lat/lng.</p>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="delivery" checked={newBiz.delivery_available}
                        onChange={(e) => setNewBiz({ ...newBiz, delivery_available: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-water focus:ring-water" />
                      <Label htmlFor="delivery" className="text-sm">Delivery Available</Label>
                    </div>
                    <Button onClick={handleCreateBusiness} disabled={savingBiz} className="w-full gap-1.5">
                      {savingBiz ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Add Service"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {filteredBiz.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No {serviceSubTab} listings.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2.5 font-medium">Name</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Barangay</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Category</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Contact</th>
                      <th className="text-left px-3 py-2.5 font-medium">Verified</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y">
                     {filteredBiz.map((biz) => (
                      <tr key={biz.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className="text-xs font-medium">{biz.name}</span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">{biz.barangay}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground">{CAT_LABEL[biz.category] || biz.category}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground">{biz.contact || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={biz.verified ? "success" : "outline"} className="text-[9px] px-1.5 py-0">
                            {biz.verified ? "Yes" : "No"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={servicePage} total={totalBusinesses} pageSize={pageSize} onChange={(p) => navigate({ servicePage: String(p) })} />
          </div>
        )}

        {/* === ANNOUNCEMENTS TAB === */}
        {tab === "announcements" && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold">Announcements</h2>
            {announcements.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left px-3 py-2.5 font-medium">Title</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Source</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Content</th>
                      <th className="text-left px-3 py-2.5 font-medium">Type</th>
                      <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Date</th>
                    </tr>
                  </thead>
                   <tbody className="divide-y">
                     {announcements.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className="text-xs font-medium">{a.title}</span>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-[11px] text-muted-foreground">{a.source}</span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className="text-[11px] text-muted-foreground line-clamp-1">{a.content}</span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={a.is_official ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                            {a.is_official ? "Official" : "Community"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-[11px] text-muted-foreground">{formatDate(a.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={announcementPage} total={totalAnnouncements} pageSize={pageSize} onChange={(p) => navigate({ announcementPage: String(p) })} />
          </div>
        )}
        {tab === "bugs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bug Reports ({bugReports.length})</h3>
            </div>
            {bugReports.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                <Bug className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p>No bug reports yet.</p>
              </div>
            ) : (
              <div className="bg-muted/40 border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/60">
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Description</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Page</th>
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Contact</th>
                      <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bugReports.map((bug) => (
                      <tr key={bug.id} className="border-b last:border-0">
                        <td className="px-3 py-2.5 max-w-xs truncate">{bug.description}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell max-w-[120px] truncate">{bug.page || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell max-w-[140px] truncate">{bug.contact || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground text-right whitespace-nowrap">{new Date(bug.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete !== null} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete report permanently?</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The report and its photo will be permanently removed.
            </p>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={() => confirmDelete && handleDeleteReport(confirmDelete)}
              disabled={updating === confirmDelete} className="gap-1.5">
              {updating === confirmDelete ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report detail dialog */}
      <Dialog open={viewReport !== null} onOpenChange={(open) => { if (!open) setViewReport(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base">{viewReport.barangay}</DialogTitle>
                  <Badge variant={
                    viewReport.status === "resolved" || viewReport.status === "approved" || (viewReport.status === "under_review" && viewReport.verified) ? "success" :
                    viewReport.status === "denied" ? "destructive" :
                    viewReport.status === "stale" ? "secondary" :
                    viewReport.status === "community_confirmed" ? "warning" :
                    viewReport.status === "under_review" ? "default" : "outline"
                  } className="text-[9px] px-1.5 py-0">
                    {(viewReport.status === "under_review" && viewReport.verified) ? STATUS_LABELS.approved : STATUS_LABELS[viewReport.status] || viewReport.status.replace("_", " ")}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {viewReport.photo_url && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img src={viewReport.photo_url} alt="Report photo" className="w-full h-48 sm:h-56 object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Report ID</p>
                    <p className="font-mono text-xs font-medium">{viewReport.report_id_display}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Water Provider</p>
                    <p className="text-xs">{WATER_PROVIDERS.find((p) => p.value === viewReport.water_provider)?.label || viewReport.water_provider}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Issue Type</p>
                    <p className="text-xs">{ISSUE_TYPES.find((t) => t.value === viewReport.issue_type)?.emoji} {ISSUE_TYPES.find((t) => t.value === viewReport.issue_type)?.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="text-xs">{STATUS_LABELS[viewReport.status] || viewReport.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Barangay</p>
                    <p className="text-xs">{viewReport.barangay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirmations</p>
                    <p className="text-xs">{viewReport.confirmation_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Started</p>
                    <p className="text-xs">{formatDate(viewReport.started_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reported</p>
                    <p className="text-xs">{timeSince(viewReport.created_at)}</p>
                  </div>
                </div>

                {viewReport.street_sitio && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Street / Sitio</p>
                    <p className="text-xs">{viewReport.street_sitio}</p>
                  </div>
                )}

                {viewReport.description && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Description</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{viewReport.description}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {!viewReport.verified && !viewReport.denied && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(viewReport.id)}
                          disabled={updating === viewReport.id} className="gap-1.5">
                          {updating === viewReport.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setDenyingId(viewReport.id); setDenyReason(""); }}
                          disabled={updating === viewReport.id} className="gap-1.5">
                          {updating === viewReport.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                          Deny
                        </Button>
                        {denyingId === viewReport.id && (
                          <div className="flex flex-col gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg mt-2">
                            <p className="text-[11px] text-destructive font-medium">Reason for denying?</p>
                            <textarea
                              value={denyReason}
                              onChange={(e) => setDenyReason(e.target.value)}
                              placeholder="e.g. Duplicate report, insufficient evidence…"
                              rows={2}
                              className="text-xs p-2 border rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-destructive"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setDenyingId(null)} className="h-7 text-xs">
                                Cancel
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeny(viewReport.id, denyReason.trim() || undefined)}
                                disabled={updating === viewReport.id} className="h-7 text-xs gap-1">
                                {updating === viewReport.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                Confirm Deny
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {viewReport.denied && (
                      <Button size="sm" onClick={() => handleApprove(viewReport.id)}
                        disabled={updating === viewReport.id} className="gap-1.5">
                        {updating === viewReport.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Revert
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1.5"
                      onClick={() => setConfirmDelete(viewReport.id)}
                      disabled={updating === viewReport.id}>
                      {updating === viewReport.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Delete
                    </Button>
                  </div>
                  {viewReport.photo_url && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground"
                      onClick={() => handleDeletePhoto(viewReport.id)}
                      disabled={updating === viewReport.id}>
                      Delete photo
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim detail dialog */}
      <Dialog open={viewClaim !== null} onOpenChange={(open) => { if (!open) setViewClaim(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {viewClaim && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{viewClaim.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {viewClaim.photo_url && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img src={viewClaim.photo_url} alt={viewClaim.name} className="w-full h-48 object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</p>
                    <p className="text-xs">{CAT_LABEL[viewClaim.category] || viewClaim.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Barangay</p>
                    <p className="text-xs">{viewClaim.barangay}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p>
                    <p className="text-xs">{viewClaim.address}</p>
                  </div>
                  {viewClaim.contact && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact</p>
                      <p className="text-xs">{viewClaim.contact}</p>
                    </div>
                  )}
                  {viewClaim.facebook && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Facebook</p>
                      <p className="text-xs truncate">{viewClaim.facebook}</p>
                    </div>
                  )}
                  {viewClaim.operating_hours && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hours</p>
                      <p className="text-xs">{viewClaim.operating_hours}</p>
                    </div>
                  )}
                  {viewClaim.coverage_area && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Coverage</p>
                      <p className="text-xs">{viewClaim.coverage_area}</p>
                    </div>
                  )}
                  {viewClaim.estimated_fee && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fee</p>
                      <p className="text-xs">{viewClaim.estimated_fee}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Submitted</p>
                    <p className="text-xs">{timeSince(viewClaim.created_at)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => handleClaimAction(viewClaim.id, "approved")}
                    disabled={updating === viewClaim.id} className="gap-1.5">
                    {updating === viewClaim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleClaimAction(viewClaim.id, "rejected")}
                    disabled={updating === viewClaim.id} className="gap-1.5">
                    {updating === viewClaim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" className="ml-auto"
                    onClick={() => setViewClaim(null)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pagination({ page, total, pageSize = 15, onChange }: { page: number; total: number; pageSize?: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-[11px] text-muted-foreground">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => onChange(page - 1)}>
          <ChevronRight className="h-3 w-3 rotate-180" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={cn(
              "h-7 min-w-[28px] text-[11px] font-medium rounded-md transition-colors",
              i === page ? "bg-water text-white" : "text-muted-foreground hover:bg-muted",
            )}>
            {i + 1}
          </button>
        ))}
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
