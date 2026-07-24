"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn, formatDate, timeSince } from "@/lib/utils";
import { ISSUE_TYPES, STATUS_LABELS, BARANGAYS, BUSINESS_CATEGORIES, WATER_PROVIDERS, EMERGENCY_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import type { WaterReport, Business, Announcement, EmergencyContact, ReportStatus } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  LogOut, MessageSquare, Building2, Megaphone, Loader2, FileText,
  CheckCircle, XCircle, Search, Shield, AlertCircle, Plus, Eye,
  ChevronRight, Clock, MapPin, Droplets, Phone, Truck, LayoutDashboard, Download, Bug,
  ChevronLeft, Pencil, Trash2, PhoneCall, Menu, X,
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
  bugReports: { id: string; description: string; page: string | null; created_at: string; resolved: boolean }[];
  totalReports: number;
  staleCount: number;
  totalBusinesses: number;
  totalAnnouncements: number;
  totalContacts: number;
  contacts: EmergencyContact[];
  pageSize: number;
  approvedCount: number;
  resolvedCount: number;
  deniedCount: number;
  verifiedBizCount: number;
  announcementPage: number;
  contactPage: number;
}

type Tab = "dashboard" | "reports" | "claims" | "directory" | "announcements" | "contacts" | "bugs";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reports", label: "Reports", icon: MessageSquare },
  { key: "claims", label: "Claims", icon: FileText },
  { key: "directory", label: "Services", icon: Building2 },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "contacts", label: "Contacts", icon: PhoneCall },
  { key: "bugs", label: "Bugs", icon: Bug },
];

const AdminLocationPicker = dynamic(() => import("@/components/reports/location-picker").then((m) => m.LocationPicker), { ssr: false });

const CAT_LABEL: Record<string, string> = {
  water_refilling: "Water Refilling & Delivery",
  water_tanker: "Water Tanker",
  water_storage: "Water Storage",
  laundry_services: "Laundry",
};

export function AdminDashboard({ reports, businesses, announcements, pendingCount, allClaims, bugReports, totalReports, staleCount, totalBusinesses, totalAnnouncements, totalContacts, contacts, pageSize, approvedCount, resolvedCount, deniedCount, verifiedBizCount, announcementPage, contactPage }: Props) {
  const pendingClaims = allClaims.filter((c) => c.status === "pending");
  const approvedClaims = allClaims.filter((c) => c.status === "approved");
  const rejectedClaims = allClaims.filter((c) => c.status === "rejected");
  const disabledBizNames = new Set(businesses.filter((b) => b.disabled).map((b) => `${b.name}||${b.barangay}`));
  const disabledClaims = allClaims.filter((c) => disabledBizNames.has(`${c.name}||${c.barangay}`));
  const router = useRouter();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [tab, setTab] = useState<Tab>("reports");
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filters
  const [providerFilter, setProviderFilter] = useState("all");
  // Export
  const [exportProvider, setExportProvider] = useState("all");
  const [exporting, setExporting] = useState(false);

  // Sub-tabs
  const [reportSubTab, setReportSubTab] = useState<"new" | "approved" | "resolved" | "denied" | "inactive">("new");
  const [claimSubTab, setClaimSubTab] = useState<"new" | "approved" | "rejected" | "disabled">("new");
  const [serviceSubTab, setServiceSubTab] = useState<"verified" | "community">("verified");
  const [bugSubTab, setBugSubTab] = useState<"open" | "resolved">("open");
  // Client-side pagination
  const [reportPage, setReportPage] = useState(0);
  const [claimPage, setClaimPage] = useState(0);
  const [servicePage, setServicePage] = useState(0);

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
    contact: "", delivery_available: false, openTime: "", closeTime: "",
    latitude: "", longitude: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Announcements CRUD
  const [showAnnounceDialog, setShowAnnounceDialog] = useState(false);
  const [editingAnnounce, setEditingAnnounce] = useState<Announcement | null>(null);
  const [announceForm, setAnnounceForm] = useState({ title: "", content: "", source: "WaterWatch SJDM", is_official: true });
  const [savingAnnounce, setSavingAnnounce] = useState(false);
  const [announceSearch, setAnnounceSearch] = useState("");

  // Contacts CRUD
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", category: "", phone: "", address: "", website: "", messenger: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactCategoryFilter, setContactCategoryFilter] = useState("all");

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

  const handleDeleteReport = useCallback(async (id: string) => { // eslint-disable-line react-hooks/preserve-manual-memoization
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

  const handleResolveBug = async (id: string) => {
    setUpdating(id);
    toastInfo("Resolving bug report…");
    const res = await fetch(`/api/bug-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: true }),
    });
    if (res.ok) {
      toastSuccess("Bug resolved", "Marked as resolved.");
      router.refresh();
    } else {
      toastError("Failed", "Could not resolve bug report.");
    }
    setUpdating(null);
  };

  const handleClaimAction = async (claimId: string, action: "approved" | "rejected" | "disable" | "enable") => {
    setUpdating(claimId);
    const labels: Record<string, string> = { approved: "Approving listing…", rejected: "Rejecting listing…", disable: "Disabling listing…", enable: "Enabling listing…" };
    toastInfo(labels[action] || "Processing…");
    const res = await fetch("/api/admin/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim_id: claimId, action }),
    });
    if (res.ok) {
      const messages: Record<string, string[]> = { approved: ["Listing approved!", "The business has been added to the directory."], rejected: ["Listing rejected", "The claim has been rejected."], disable: ["Listing disabled", "It is now hidden from the directory."], enable: ["Listing enabled", "It is now visible in the directory."] };
      const msg = messages[action] || ["Done", ""];
      toastSuccess(msg[0], msg[1]);
    } else {
      toastError("Action failed", "Could not process the claim. Please try again.");
    }
    router.refresh();
    setUpdating(null);
  };

  const resetAnnounceForm = () => setAnnounceForm({ title: "", content: "", source: "WaterWatch SJDM", is_official: true });

  const openNewAnnounce = () => {
    setEditingAnnounce(null);
    resetAnnounceForm();
    setShowAnnounceDialog(true);
  };

  const openEditAnnounce = (a: Announcement) => {
    setEditingAnnounce(a);
    setAnnounceForm({ title: a.title, content: a.content, source: a.source, is_official: a.is_official });
    setShowAnnounceDialog(true);
  };

  const handleSaveAnnounce = async () => {
    if (!announceForm.title || !announceForm.content) {
      toastError("Missing fields", "Title and content are required.");
      return;
    }
    setSavingAnnounce(true);
    try {
      const isEdit = !!editingAnnounce;
      const res = await fetch("/api/admin/announcements", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingAnnounce.id, ...announceForm } : announceForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");
      toastSuccess(isEdit ? "Updated" : "Created", `Announcement has been ${isEdit ? "updated" : "created"}.`);
      setShowAnnounceDialog(false);
      router.refresh();
    } catch (err: unknown) {
      toastError("Failed", err instanceof Error ? err.message : "Something went wrong");
    }
    setSavingAnnounce(false);
  };

  const handleDeleteAnnounce = async (id: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toastSuccess("Deleted", "Announcement has been removed.");
      router.refresh();
    } catch {
      toastError("Delete failed", "Could not delete announcement.");
    }
    setUpdating(null);
  };

  const resetContactForm = () => setContactForm({ name: "", category: "", phone: "", address: "", website: "", messenger: "" });

  const openNewContact = () => {
    setEditingContact(null);
    resetContactForm();
    setShowContactDialog(true);
  };

  const openEditContact = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactForm({
      name: c.name, category: c.category, phone: c.phone || "", address: c.address || "",
      website: c.website || "", messenger: c.messenger || "",
    });
    setShowContactDialog(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name || !contactForm.category) {
      toastError("Missing fields", "Name and category are required.");
      return;
    }
    setSavingContact(true);
    try {
      const isEdit = !!editingContact;
      const res = await fetch("/api/admin/contacts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingContact.id, ...contactForm } : contactForm),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Something went wrong");
      toastSuccess(isEdit ? "Updated" : "Created", `Contact has been ${isEdit ? "updated" : "added"}.`);
      setShowContactDialog(false);
      router.refresh();
    } catch (err: unknown) {
      toastError("Failed", err instanceof Error ? err.message : "Something went wrong");
    }
    setSavingContact(false);
  };

  const handleDeleteContact = async (id: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toastSuccess("Deleted", "Contact has been removed.");
      router.refresh();
    } catch {
      toastError("Delete failed", "Could not delete contact.");
    }
    setUpdating(null);
  };

  const handleCreateBusiness = async () => {
    if (!newBiz.name || !newBiz.category || !newBiz.address || !newBiz.barangay) {
      toastError("Missing fields", "Name, category, address, and barangay are required.");
      return;
    }
    setSavingBiz(true);
    try {
      const body: Record<string, unknown> = { ...newBiz, operating_hours: newBiz.openTime && newBiz.closeTime ? `${newBiz.openTime} — ${newBiz.closeTime}` : "" };
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
      setNewBiz({ name: "", category: "", address: "", barangay: "", contact: "", delivery_available: false, openTime: "", closeTime: "", latitude: "", longitude: "" });
      router.refresh();
    } catch (err: unknown) {
      toastError("Failed to add", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingBiz(false);
    }
  };

  const allFiltered = reports.filter((r) => {
    if (reportSubTab === "new") return !r.verified && !r.denied;
    if (reportSubTab === "approved") return r.status === "approved";
    if (reportSubTab === "resolved") return r.status === "resolved";
    if (reportSubTab === "inactive") return r.status === "stale";
    return r.denied;
  }).filter((r) =>
    (!search || r.report_id_display.toLowerCase().includes(search.toLowerCase()) || r.barangay.toLowerCase().includes(search.toLowerCase())) &&
    (providerFilter === "all" || r.water_provider === providerFilter)
  );
  const filteredReports = allFiltered.slice(reportPage * pageSize, (reportPage + 1) * pageSize);

  const claimSourceAll = claimSubTab === "new" ? pendingClaims : claimSubTab === "approved" ? approvedClaims : claimSubTab === "rejected" ? rejectedClaims : disabledClaims;
  const claimSource = claimSourceAll.slice(claimPage * pageSize, (claimPage + 1) * pageSize);

  const filteredBizAll = businesses.filter((b) => serviceSubTab === "verified" ? b.verified : !b.verified);
  const filteredBiz = filteredBizAll.slice(servicePage * pageSize, (servicePage + 1) * pageSize);

  const tabCounts: Record<string, string> = {
    reports: totalReports > 0 ? `${totalReports}` : "",
    claims: pendingClaims.length ? `${pendingClaims.length}` : "",
    directory: totalBusinesses > 0 ? `${totalBusinesses}` : "",
    announcements: totalAnnouncements > 0 ? `${totalAnnouncements}` : "",
    contacts: totalContacts > 0 ? `${totalContacts}` : "",
    bugs: bugReports.length ? `${bugReports.length}` : "",
  };

  // Dashboard computations
  const activeReports = reports.filter((r) => r.status === "approved");
  const resolvedPct = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;
  const now = new Date();
  const phNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = phNow.toISOString().slice(0, 10);
  const reportsToday = reports.filter((r) => r.created_at?.slice(0, 10) === todayStr).length;
  const openBugs = bugReports.filter((b) => !b.resolved).length;

  const issueCounts: Record<string, number> = {};
  activeReports.forEach((r) => { issueCounts[r.issue_type] = (issueCounts[r.issue_type] || 0) + 1; });
  const totalActive = activeReports.length || 1;

  const providerCounts: Record<string, number> = {};
  reports.forEach((r) => { providerCounts[r.water_provider] = (providerCounts[r.water_provider] || 0) + 1; });

  const barangayActive: Record<string, number> = {};
  activeReports.forEach((r) => { barangayActive[r.barangay] = (barangayActive[r.barangay] || 0) + 1; });
  const topBarangays = Object.entries(barangayActive).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Reports per day for last 14 days (PH time)
  const dayLabels: string[] = [];
  const dayCounts: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(phNow);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayLabels.push(key.slice(5));
    dayCounts.push(reports.filter((r) => r.created_at?.slice(0, 10) === key).length);
  }
  const maxDay = Math.max(...dayCounts, 1);

  // Recent activity
  const sortedByDate = [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const recentActivity = sortedByDate.slice(0, 6);

  // Latest pending
  const latestPending = reports.filter((r) => r.status === "submitted" && !r.verified).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-56 shrink-0 border-r bg-background flex-col",
        "fixed lg:static inset-y-0 left-0 z-40",
        "transition-transform duration-200 ease-in-out lg:transition-none",
        sidebarOpen ? "translate-x-0 lg:translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:flex",
      )}>
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-water flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">WaterWatch</p>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5" aria-label="Main navigation">
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
          <div className="pt-1">
            <a href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <Droplets className="h-4 w-4" /> Back to WaterWatch
            </a>
          </div>
        </nav>

        <div className="p-3 border-t space-y-2">
            <div className="text-[10px] text-muted-foreground space-y-0.5 px-1">
              <div className="flex justify-between"><span>Pending reports</span><span className="font-medium text-amber-600">{pendingCount}</span></div>
              <div className="flex justify-between"><span>Total reports</span><span className="font-medium">{totalReports}</span></div>
              <div className="flex justify-between"><span>Resolved</span><span className="font-medium text-emerald-600">{resolvedCount}</span></div>
              <div className="flex justify-between"><span>Inactive</span><span className="font-medium text-muted-foreground">{staleCount}</span></div>
            </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full text-xs h-8 gap-1.5">
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main work area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto relative">
        {/* Floating hamburger — mobile only */}
        <button
          className="lg:hidden fixed top-0 right-0 z-20 w-10 h-10 flex items-center justify-center rounded-bl-lg bg-background border-l border-b shadow-sm text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </button>
        {/* === DASHBOARD TAB === */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-base sm:text-lg font-semibold">Dashboard</h2>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Active Reports</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{activeReports.length}</p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Resolved</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-emerald-600">{resolvedPct}%</p>
                <p className="text-[10px] text-muted-foreground">{resolvedCount}/{totalReports} reports</p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Today</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{reportsToday}</p>
                <p className="text-[10px] text-muted-foreground">reports submitted</p>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Needs Attention</span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-amber-600">{staleCount + pendingCount + openBugs}</p>
                <p className="text-[10px] text-muted-foreground">{staleCount} stale · {pendingCount} pending · {openBugs} bugs</p>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Activity */}
              <div className="rounded-xl border p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-water" /> Recent Activity
                </h3>
                <div className="space-y-2">
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No reports yet.</p>
                  ) : (
                    recentActivity.map((r) => {
                      const issue = ISSUE_TYPES.find((t) => t.value === r.issue_type);
                      return (
                        <div key={r.id} className="flex items-start gap-2.5 text-xs">
                          <span className="text-sm shrink-0">{issue?.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">{r.barangay}</span>
                              <Badge variant={
                                r.status === "resolved" || r.status === "approved" ? "success" :
                                r.status === "stale" ? "secondary" :
                                r.status === "denied" ? "destructive" : "outline"
                              } className="text-[8px] px-1 py-0">{STATUS_LABELS[r.status] || r.status}</Badge>
                            </div>
                            <p className="text-muted-foreground truncate">{r.report_id_display} · {new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Issue Type Breakdown */}
              <div className="rounded-xl border p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-water" /> Active Issues
                </h3>
                {ISSUE_TYPES.filter((i) => (issueCounts[i.value] || 0) > 0).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No active issues.</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full shrink-0" style={{
                      background: `conic-gradient(${ISSUE_TYPES.filter((i) => (issueCounts[i.value] || 0) > 0).map((issue, idx, arr) => {
                        const pct = ((issueCounts[issue.value] || 0) / totalActive) * 100;
                        const start = arr.slice(0, idx).reduce((s, is) => s + ((issueCounts[is.value] || 0) / totalActive) * 100, 0);
                        const colors = ["#dc2626", "#ea580c", "#a16207", "#2563eb", "#7c3aed", "#6b7280"];
                        return `${colors[idx % colors.length]} ${start}% ${start + pct}%`;
                      }).join(", ")})`,
                    }}>
                      <div className="w-16 h-16 rounded-full bg-background m-auto relative top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <span className="text-lg font-bold tabular-nums">{activeReports.length}</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {ISSUE_TYPES.filter((i) => (issueCounts[i.value] || 0) > 0).map((issue, idx) => {
                        const count = issueCounts[issue.value] || 0;
                        const pct = Math.round((count / totalActive) * 100);
                        const colors = ["#dc2626", "#ea580c", "#a16207", "#2563eb", "#7c3aed", "#6b7280"];
                        return (
                          <div key={issue.value} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-[10px] truncate">{issue.label}</span>
                            </div>
                            <span className="text-[10px] tabular-nums font-medium shrink-0">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reports Over Time */}
              <div className="rounded-xl border p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-water" /> Reports (Last 14 Days)
                </h3>
                <div className="flex items-end gap-1 h-24">
                  {dayLabels.map((label, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[9px] tabular-nums text-muted-foreground">{dayCounts[i] || ""}</span>
                      <div className="w-full rounded-t-sm transition-all hover:opacity-80" style={{
                        height: `${(dayCounts[i] / maxDay) * 100}%`,
                        backgroundColor: dayCounts[i] > 0 ? "#1d7abf" : "transparent",
                        minHeight: dayCounts[i] > 0 ? "4px" : "0",
                      }} />
                      <span className="text-[8px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Barangays + Providers */}
              <div className="rounded-xl border p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-water" /> Top Barangays & Providers
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Most Active Barangays</p>
                    {topBarangays.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">No active reports.</p>
                    ) : (
                      <div className="space-y-1">
                        {topBarangays.map(([b, c], i) => (
                          <div key={b} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-500" : "bg-blue-500")} />
                              <span className="truncate">{b}</span>
                            </div>
                            <span className="tabular-nums font-medium">{c} active</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-1.5">By Water Provider</p>
                    <div className="space-y-1">
                      {WATER_PROVIDERS.map((p) => (
                        <div key={p.value} className="flex items-center justify-between text-xs">
                          <span>{p.label}</span>
                          <span className="tabular-nums font-medium">{providerCounts[p.value] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => switchTab("reports")}
                className="rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">All Reports</span>
                </div>
                <p className="text-lg font-bold tabular-nums">{totalReports}</p>
                <p className="text-[10px] text-muted-foreground">{pendingCount} pending review</p>
              </button>
              <button onClick={() => switchTab("bugs")}
                className="rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-sm hover:border-water/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Bug className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Bug Reports</span>
                </div>
                <p className="text-lg font-bold tabular-nums">{bugReports.length}</p>
                <p className="text-[10px] text-muted-foreground">{openBugs} unresolved</p>
              </button>
              {latestPending && (
                <div className="rounded-xl border p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">Quick Approve</span>
                  </div>
                  <p className="text-xs truncate font-medium">{latestPending.barangay} · {ISSUE_TYPES.find((t) => t.value === latestPending.issue_type)?.emoji} {latestPending.report_id_display}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{new Date(latestPending.created_at).toLocaleDateString()}</p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 flex-1"
                      onClick={() => setViewReport(latestPending)}>
                      <Eye className="h-3 w-3" /> View Details
                    </Button>
                    <Button size="sm" className="h-7 text-[10px] gap-1 flex-1"
                      onClick={(e) => { e.stopPropagation(); handleApprove(latestPending.id); }}
                      disabled={updating === latestPending.id}>
                      {updating === latestPending.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === REPORTS TAB === */}
        {tab === "reports" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-full sm:w-fit overflow-x-auto">
                {(["new", "approved", "resolved", "denied", "inactive"] as const).map((st) => (
                   <button key={st} onClick={() => { setReportSubTab(st); setReportPage(0); }}
                    className={cn(
                      "px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all whitespace-nowrap",
                      reportSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}>
                    {st === "new" ? `New (${pendingCount})`
                      : st === "approved" ? `Approved (${approvedCount})`
                      : st === "resolved" ? `Resolved (${resolvedCount})`
                      : st === "denied" ? `Denied (${deniedCount})`
                      : `Inactive (${staleCount})`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); }}>
                  <SelectTrigger className="h-8 text-[10px] sm:text-xs w-24 sm:w-28">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {WATER_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                  <Input placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); }}
                    className="pl-8 h-8 text-[10px] sm:text-xs" />
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-muted/30 rounded-lg p-2.5 border">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Export:</span>
                <Select value={exportProvider} onValueChange={setExportProvider}>
                  <SelectTrigger className="h-7 text-xs flex-1 sm:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {WATER_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Excel
                </Button>
              </div>
            </div>

            {allFiltered.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No reports found.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-medium">{report.report_id_display}</span>
                        <Badge variant={
                          report.status === "resolved" || report.status === "approved" ? "success" :
                          report.status === "denied" ? "destructive" :
                          report.status === "stale" ? "secondary" : "outline"
                        } className="text-[8px] px-1 py-0">{STATUS_LABELS[report.status] || report.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{report.barangay}</span>
                        <span>·</span>
                        <span>{ISSUE_TYPES.find((t) => t.value === report.issue_type)?.emoji} {ISSUE_TYPES.find((t) => t.value === report.issue_type)?.label}</span>
                        <span>·</span>
                        <span>{timeSince(report.created_at)}</span>
                      </div>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                          onClick={() => setViewReport(report)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => setConfirmDelete(report.id)} disabled={updating === report.id}>
                          <XCircle className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-3 py-2.5 font-medium">ID</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Barangay</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Issue</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden xl:table-cell">Provider</th>
                        <th className="text-left px-3 py-2.5 font-medium">Status</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Date</th>
                        <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y">
                       {filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3"><span className="font-mono text-[11px] font-medium">{report.report_id_display}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-xs">{report.barangay}</span></td>
                          <td className="px-3 py-3 hidden lg:table-cell"><span className="text-xs">{ISSUE_TYPES.find((t) => t.value === report.issue_type)?.emoji} {ISSUE_TYPES.find((t) => t.value === report.issue_type)?.label}</span></td>
                          <td className="px-3 py-3 hidden xl:table-cell"><span className="text-[11px] text-muted-foreground">{WATER_PROVIDERS.find((p) => p.value === report.water_provider)?.label || report.water_provider}</span></td>
                          <td className="px-3 py-3">
                            <Badge variant={
                              report.status === "resolved" || report.status === "approved" ? "success" :
                              report.status === "denied" ? "destructive" :
                              report.status === "stale" ? "secondary" : "outline"
                            } className="text-[9px] px-1.5 py-0">
                              {STATUS_LABELS[report.status] || report.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-[11px] text-muted-foreground">{timeSince(report.created_at)}</span></td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => setViewReport(report)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                                onClick={() => setConfirmDelete(report.id)} disabled={updating === report.id}>
                                <XCircle className="h-3.5 w-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination page={reportPage} total={allFiltered.length} pageSize={pageSize} onChange={(p) => { setReportPage(p); }} itemsCount={filteredReports.length} />
          </div>
        )}

        {/* === CLAIMS TAB === */}
        {tab === "claims" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-full sm:w-fit overflow-x-auto">
              {(["new", "approved", "rejected", "disabled"] as const).map((st) => {
                const count = st === "new" ? pendingClaims.length : st === "approved" ? approvedClaims.length : st === "rejected" ? rejectedClaims.length : disabledClaims.length;
                return (
                  <button key={st} onClick={() => { setClaimSubTab(st); setClaimPage(0); }}
                    className={cn(
                      "px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all capitalize whitespace-nowrap",
                      claimSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}>
                    {st === "new" ? `New (${count})` : `${st} (${count})`}
                  </button>
                );
              })}
            </div>
            {claimSourceAll.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No {claimSubTab} claims.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {claimSource.map((claim) => (
                    <div key={claim.id} className="border rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold truncate">{claim.name}</span>
                        <span className="text-[9px] text-muted-foreground shrink-0">{claim.barangay}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {CAT_LABEL[claim.category] || claim.category} · {claim.contact || "—"} · {timeSince(claim.created_at)}
                      </div>
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                          onClick={() => setViewClaim(claim)}><Eye className="h-3 w-3" /></Button>
                        {claimSubTab === "new" && (
                          <>
                            <Button size="sm" className="h-6 text-[9px] px-1.5 bg-success hover:bg-success/90"
                              onClick={() => handleClaimAction(claim.id, "approved")} disabled={updating === claim.id}>
                              {updating === claim.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Approve"}
                            </Button>
                            <Button size="sm" variant="destructive" className="h-6 text-[9px] px-1.5"
                              onClick={() => handleClaimAction(claim.id, "rejected")} disabled={updating === claim.id}>
                              {updating === claim.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Reject"}
                            </Button>
                          </>
                        )}
                        {claimSubTab === "approved" && (
                          <Button size="sm" variant="outline" className="h-6 text-[9px] px-1.5 text-muted-foreground"
                            onClick={() => handleClaimAction(claim.id, "disable")} disabled={updating === claim.id}>
                            {updating === claim.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Disable"}
                          </Button>
                        )}
                        {claimSubTab === "rejected" && (
                          <Button size="sm" className="h-6 text-[9px] px-1.5 bg-water hover:bg-water/90"
                            onClick={() => handleClaimAction(claim.id, "approved")} disabled={updating === claim.id}>
                            {updating === claim.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Re-approve"}
                          </Button>
                        )}
                        {claimSubTab === "disabled" && (
                          <Button size="sm" className="h-6 text-[9px] px-1.5 bg-water hover:bg-water/90"
                            onClick={() => handleClaimAction(claim.id, "enable")} disabled={updating === claim.id}>
                            {updating === claim.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Enable"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-3 py-2.5 font-medium">Business</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Barangay</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Category</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden xl:table-cell">Contact</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Submitted</th>
                        <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y">
                       {claimSource.map((claim) => (
                        <tr key={claim.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3"><span className="text-xs font-medium">{claim.name}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{claim.barangay}</span></td>
                          <td className="px-3 py-3 hidden lg:table-cell"><span className="text-[11px] text-muted-foreground">{CAT_LABEL[claim.category] || claim.category}</span></td>
                          <td className="px-3 py-3 hidden xl:table-cell"><span className="text-[11px] text-muted-foreground">{claim.contact || "—"}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-[11px] text-muted-foreground">{timeSince(claim.created_at)}</span></td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                onClick={() => setViewClaim(claim)}><Eye className="h-3.5 w-3.5" /></Button>
                              {claimSubTab === "new" && (
                                <>
                                  <Button size="sm" className="h-7 text-[10px] px-2 bg-success hover:bg-success/90"
                                    onClick={() => handleClaimAction(claim.id, "approved")} disabled={updating === claim.id}>
                                    {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" /> Approve</>}
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2"
                                    onClick={() => handleClaimAction(claim.id, "rejected")} disabled={updating === claim.id}>
                                    {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><XCircle className="h-3 w-3 mr-1" /> Reject</>}
                                  </Button>
                                </>
                              )}
                              {claimSubTab === "approved" && (
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-muted-foreground"
                                  onClick={() => handleClaimAction(claim.id, "disable")} disabled={updating === claim.id}>
                                  {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disable"}
                                </Button>
                              )}
                              {claimSubTab === "rejected" && (
                                <Button size="sm" className="h-7 text-[10px] px-2 bg-water hover:bg-water/90"
                                  onClick={() => handleClaimAction(claim.id, "approved")} disabled={updating === claim.id}>
                                  {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3 mr-1" /> Re-approve</>}
                                </Button>
                              )}
                              {claimSubTab === "disabled" && (
                                <Button size="sm" className="h-7 text-[10px] px-2 bg-water hover:bg-water/90"
                                  onClick={() => handleClaimAction(claim.id, "enable")} disabled={updating === claim.id}>
                                  {updating === claim.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Enable"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination page={claimPage} total={claimSourceAll.length} pageSize={pageSize} onChange={(p) => { setClaimPage(p); }} itemsCount={claimSource.length} />
          </div>
        )}

        {/* === DIRECTORY TAB === */}
        {tab === "directory" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-full sm:w-fit overflow-x-auto">
              {(["verified", "community"] as const).map((st) => {
                const count = st === "verified" ? verifiedBizCount : totalBusinesses - verifiedBizCount;
                return (
                  <button key={st} onClick={() => { setServiceSubTab(st); setServicePage(0); }}
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
                      <div className="flex items-center gap-2">
                        <input type="time" value={newBiz.openTime} onChange={(e) => setNewBiz({ ...newBiz, openTime: e.target.value })}
                          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                        <span className="text-muted-foreground text-xs">—</span>
                        <input type="time" value={newBiz.closeTime} onChange={(e) => setNewBiz({ ...newBiz, closeTime: e.target.value })}
                          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Map Location</Label>
                      <div className="h-[250px] rounded-lg border overflow-hidden">
                        <AdminLocationPicker
                          barangay={newBiz.barangay}
                          lat={newBiz.latitude ? parseFloat(newBiz.latitude) : null}
                          lng={newBiz.longitude ? parseFloat(newBiz.longitude) : null}
                          onPin={(lat, lng) => setNewBiz({ ...newBiz, latitude: String(lat), longitude: String(lng) })}
                        />
                      </div>
                    </div>
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

            {filteredBizAll.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No {serviceSubTab} listings.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {filteredBiz.map((biz) => (
                    <div key={biz.id} className="border rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold truncate">{biz.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{biz.barangay} · {CAT_LABEL[biz.category] || biz.category} · {biz.contact || "—"}</p>
                      </div>
                      <Badge variant={biz.verified ? "success" : "outline"} className="text-[8px] px-1 py-0 shrink-0">
                        {biz.verified ? "V" : "C"}
                      </Badge>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm min-w-[450px]">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-3 py-2.5 font-medium">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Barangay</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Category</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden xl:table-cell">Contact</th>
                        <th className="text-left px-3 py-2.5 font-medium">Verified</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y">
                       {filteredBiz.map((biz) => (
                        <tr key={biz.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3"><span className="text-xs font-medium">{biz.name}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-xs text-muted-foreground">{biz.barangay}</span></td>
                          <td className="px-3 py-3 hidden lg:table-cell"><span className="text-[11px] text-muted-foreground">{CAT_LABEL[biz.category] || biz.category}</span></td>
                          <td className="px-3 py-3 hidden xl:table-cell"><span className="text-[11px] text-muted-foreground">{biz.contact || "—"}</span></td>
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
              </>
            )}
            <Pagination page={servicePage} total={filteredBizAll.length} pageSize={pageSize} onChange={(p) => { setServicePage(p); }} itemsCount={filteredBiz.length} />
          </div>
        )}

        {/* === ANNOUNCEMENTS TAB === */}
        {tab === "announcements" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">Announcements</h2>
              <Button size="sm" className="text-xs gap-1.5" onClick={openNewAnnounce}>
                <Plus className="h-3.5 w-3.5" /> New Announcement
              </Button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search announcements…" value={announceSearch} onChange={(e) => setAnnounceSearch(e.target.value)}
                className="pl-8 h-8 text-xs" />
            </div>
            {announcements.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="border rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold truncate">{a.title}</span>
                        <Badge variant={a.is_official ? "default" : "secondary"} className="text-[7px] px-1 py-0 shrink-0">
                          {a.is_official ? "Official" : "Community"}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground line-clamp-2">{a.content}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] text-muted-foreground">{a.source} · {formatDate(a.created_at)}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditAnnounce(a)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteAnnounce(a.id)} disabled={updating === a.id}>
                            {updating === a.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-3 py-2.5 font-medium">Title</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Source</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Content</th>
                        <th className="text-left px-3 py-2.5 font-medium">Type</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Date</th>
                        <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y">
                       {announcements.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3"><span className="text-xs font-medium">{a.title}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-[11px] text-muted-foreground">{a.source}</span></td>
                          <td className="px-3 py-3 hidden lg:table-cell"><span className="text-[11px] text-muted-foreground line-clamp-1">{a.content}</span></td>
                          <td className="px-3 py-3">
                            <Badge variant={a.is_official ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                              {a.is_official ? "Official" : "Community"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell"><span className="text-[11px] text-muted-foreground">{formatDate(a.created_at)}</span></td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditAnnounce(a)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteAnnounce(a.id)} disabled={updating === a.id}>
                                {updating === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination page={announcementPage} total={totalAnnouncements} pageSize={pageSize} onChange={(p) => navigate({ announcementPage: String(p) })} />
          </div>
        )}
        {/* === CONTACTS TAB === */}
        {tab === "contacts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold">Emergency Contacts</h2>
              <Button size="sm" className="text-xs gap-1.5" onClick={openNewContact}>
                <Plus className="h-3.5 w-3.5" /> Add Contact
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                <Input placeholder="Search contacts…" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-7 sm:pl-8 h-8 text-[10px] sm:text-xs" />
              </div>
              <Select value={contactCategoryFilter} onValueChange={setContactCategoryFilter}>
                <SelectTrigger className="h-8 text-[10px] sm:text-xs w-full sm:w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EMERGENCY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {contacts.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
                <PhoneCall className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No contacts yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="border rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold truncate">{c.name}</span>
                        <Badge variant="secondary" className="text-[7px] px-1 py-0 shrink-0">
                          {EMERGENCY_CATEGORIES.find((ec) => ec.value === c.category)?.label || c.category}
                        </Badge>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{c.phone || "—"} · {c.address || "—"}</div>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditContact(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteContact(c.id)} disabled={updating === c.id}>
                          {updating === c.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm min-w-[450px]">
                    <thead>
                      <tr className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-3 py-2.5 font-medium">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Category</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Phone</th>
                        <th className="text-left px-3 py-2.5 font-medium hidden xl:table-cell">Address</th>
                        <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                      </tr>
                    </thead>
                     <tbody className="divide-y">
                       {contacts.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-3"><span className="text-xs font-medium">{c.name}</span></td>
                          <td className="px-3 py-3 hidden md:table-cell">
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                              {EMERGENCY_CATEGORIES.find((ec) => ec.value === c.category)?.label || c.category}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 hidden lg:table-cell"><span className="text-[11px] text-muted-foreground">{c.phone || "—"}</span></td>
                          <td className="px-3 py-3 hidden xl:table-cell"><span className="text-[11px] text-muted-foreground line-clamp-1">{c.address || "—"}</span></td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditContact(c)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteContact(c.id)} disabled={updating === c.id}>
                                {updating === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination page={contactPage} total={totalContacts} pageSize={pageSize} onChange={(p) => navigate({ contactPage: String(p) })} />
          </div>
        )}

        {tab === "bugs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bug Reports ({bugReports.length})</h3>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {(["open", "resolved"] as const).map((st) => {
                  const count = st === "open" ? bugReports.filter((b) => !b.resolved).length : bugReports.filter((b) => b.resolved).length;
                  return (
                    <button key={st} onClick={() => setBugSubTab(st)}
                      className={cn(
                        "px-2.5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all capitalize whitespace-nowrap",
                        bugSubTab === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}>
                      {st === "open" ? `Open (${count})` : `Resolved (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>
            {(() => {
              const filtered = bugReports.filter((b) => bugSubTab === "open" ? !b.resolved : b.resolved);
              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    <Bug className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p>{bugSubTab === "open" ? "No open bug reports." : "No resolved bug reports."}</p>
                  </div>
                );
              }
              return (
                <>
                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-2">
                    {filtered.map((bug) => (
                      <div key={bug.id} className="border rounded-lg p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] line-clamp-2 flex-1">{bug.description}</p>
                          {bug.resolved ? (
                            <Badge variant="success" className="text-[8px] px-1 py-0 shrink-0">Resolved</Badge>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0 text-emerald-600"
                              onClick={() => handleResolveBug(bug.id)} disabled={updating === bug.id}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                          <span>{bug.page || "—"}</span>
                          <span>{new Date(bug.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden sm:block bg-muted/40 border rounded-xl overflow-x-auto">
                    <table className="w-full text-xs min-w-[400px]">
                      <thead>
                        <tr className="border-b bg-muted/60">
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Description</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Page</th>
                          <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                          <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((bug) => (
                          <tr key={bug.id} className="border-b last:border-0">
                            <td className="px-3 py-2.5 max-w-xs truncate">{bug.description}</td>
                            <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell max-w-[120px] truncate">{bug.page || "—"}</td>
                            <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell whitespace-nowrap">{new Date(bug.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2.5 text-right">
                              {bug.resolved ? (
                                <Badge variant="success" className="text-[9px] px-1.5 py-0">Resolved</Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                  onClick={() => handleResolveBug(bug.id)} disabled={updating === bug.id}>
                                  {updating === bug.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                  Resolve
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* Announcement create/edit dialog */}
      <Dialog open={showAnnounceDialog} onOpenChange={(open) => { if (!open) setShowAnnounceDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingAnnounce ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={announceForm.title} onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea value={announceForm.content} onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                rows={4} className="text-sm resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input value={announceForm.source} onChange={(e) => setAnnounceForm({ ...announceForm, source: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_official" checked={announceForm.is_official}
                onChange={(e) => setAnnounceForm({ ...announceForm, is_official: e.target.checked })}
                className="h-4 w-4 rounded border-border text-water focus:ring-water" />
              <Label htmlFor="is_official" className="text-sm">Official Announcement</Label>
            </div>
            <Button onClick={handleSaveAnnounce} disabled={savingAnnounce} className="w-full gap-1.5">
              {savingAnnounce ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editingAnnounce ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact create/edit dialog */}
      <Dialog open={showContactDialog} onOpenChange={(open) => { if (!open) setShowContactDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={contactForm.category} onValueChange={(v) => setContactForm({ ...contactForm, category: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EMERGENCY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="h-9 text-sm" placeholder="e.g. 0917-xxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={contactForm.address} onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={contactForm.website} onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Messenger</Label>
                <Input value={contactForm.messenger} onChange={(e) => setContactForm({ ...contactForm, messenger: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <Button onClick={handleSaveContact} disabled={savingContact} className="w-full gap-1.5">
              {savingContact ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : editingContact ? "Update" : "Add Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {viewReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm sm:text-base">{viewReport.barangay}</DialogTitle>
                  <Badge variant={
                    viewReport.status === "resolved" || viewReport.status === "approved" ? "success" :
                    viewReport.status === "denied" ? "destructive" :
                    viewReport.status === "stale" ? "secondary" : "outline"
                  } className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 shrink-0">
                    {STATUS_LABELS[viewReport.status] || viewReport.status.replace("_", " ")}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-3 sm:space-y-4">
                {viewReport.photo_url && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img src={viewReport.photo_url} alt="Report photo" className="w-full h-40 sm:h-56 object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Report ID</p>
                    <p className="font-mono text-[11px] sm:text-xs font-medium">{viewReport.report_id_display}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Water Provider</p>
                    <p className="text-[11px] sm:text-xs">{WATER_PROVIDERS.find((p) => p.value === viewReport.water_provider)?.label || viewReport.water_provider}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Issue Type</p>
                    <p className="text-[11px] sm:text-xs">{ISSUE_TYPES.find((t) => t.value === viewReport.issue_type)?.emoji} {ISSUE_TYPES.find((t) => t.value === viewReport.issue_type)?.label}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="text-[11px] sm:text-xs">{STATUS_LABELS[viewReport.status] || viewReport.status}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Barangay</p>
                    <p className="text-[11px] sm:text-xs">{viewReport.barangay}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Confirmations</p>
                    <p className="text-[11px] sm:text-xs">{viewReport.confirmation_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Started</p>
                    <p className="text-[11px] sm:text-xs">{formatDate(viewReport.started_at)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Reported</p>
                    <p className="text-[11px] sm:text-xs">{timeSince(viewReport.created_at)}</p>
                  </div>
                </div>

                {viewReport.street_sitio && (
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Street / Sitio</p>
                    <p className="text-[11px] sm:text-xs">{viewReport.street_sitio}</p>
                  </div>
                )}

                {viewReport.description && (
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Description</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{viewReport.description}</p>
                  </div>
                )}

                <Separator />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {viewReport.status === "submitted" || viewReport.denied ? (
                      <>
                        {viewReport.denied ? (
                          <Button size="sm" onClick={() => handleApprove(viewReport.id)}
                            disabled={updating === viewReport.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                            {updating === viewReport.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                            Revert
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" onClick={() => handleApprove(viewReport.id)}
                              disabled={updating === viewReport.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                              {updating === viewReport.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setDenyingId(viewReport.id); setDenyReason(""); }}
                              disabled={updating === viewReport.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                              {updating === viewReport.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                              Deny
                            </Button>
                          </>
                        )}
                      </>
                    ) : viewReport.verified && !viewReport.denied ? (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => { setDenyingId(viewReport.id); setDenyReason(""); }}
                          disabled={updating === viewReport.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                          {updating === viewReport.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          Deny
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive gap-1 h-7 sm:h-8 text-[10px] sm:text-xs"
                          onClick={() => setConfirmDelete(viewReport.id)}
                          disabled={updating === viewReport.id}>
                          {updating === viewReport.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </div>
                  {viewReport.photo_url && !viewReport.denied && (
                    <Button size="sm" variant="ghost" className="text-[10px] sm:text-xs text-muted-foreground h-7 sm:h-8"
                      onClick={() => handleDeletePhoto(viewReport.id)}
                      disabled={updating === viewReport.id}>
                      Delete photo
                    </Button>
                  )}
                </div>
                {denyingId === viewReport.id && (
                  <div className="flex flex-col gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg -mt-1">
                    <p className="text-[10px] sm:text-[11px] text-destructive font-medium">Reason for denying?</p>
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Claim detail dialog */}
      <Dialog open={viewClaim !== null} onOpenChange={(open) => { if (!open) setViewClaim(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {viewClaim && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">{viewClaim.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                {viewClaim.photo_url && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img src={viewClaim.photo_url} alt={viewClaim.name} className="w-full h-36 sm:h-48 object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Category</p>
                    <p className="text-[11px] sm:text-xs">{CAT_LABEL[viewClaim.category] || viewClaim.category}</p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Barangay</p>
                    <p className="text-[11px] sm:text-xs">{viewClaim.barangay}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Address</p>
                    <p className="text-[11px] sm:text-xs">{viewClaim.address}</p>
                  </div>
                  {viewClaim.contact && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Contact</p>
                      <p className="text-[11px] sm:text-xs">{viewClaim.contact}</p>
                    </div>
                  )}
                  {viewClaim.facebook && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Facebook</p>
                      <p className="text-[11px] sm:text-xs truncate">{viewClaim.facebook}</p>
                    </div>
                  )}
                  {viewClaim.operating_hours && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Hours</p>
                      <p className="text-[11px] sm:text-xs">{viewClaim.operating_hours}</p>
                    </div>
                  )}
                  {viewClaim.coverage_area && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Coverage</p>
                      <p className="text-[11px] sm:text-xs">{viewClaim.coverage_area}</p>
                    </div>
                  )}
                  {viewClaim.estimated_fee && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Fee</p>
                      <p className="text-[11px] sm:text-xs">{viewClaim.estimated_fee}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Submitted</p>
                    <p className="text-[11px] sm:text-xs">{timeSince(viewClaim.created_at)}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {viewClaim.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleClaimAction(viewClaim.id, "approved")}
                        disabled={updating === viewClaim.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                        {updating === viewClaim.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleClaimAction(viewClaim.id, "rejected")}
                        disabled={updating === viewClaim.id} className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs">
                        {updating === viewClaim.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                        Reject
                      </Button>
                    </>
                  )}
                  {viewClaim.status === "rejected" && (
                    <Button size="sm" className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs bg-water hover:bg-water/90"
                      onClick={() => handleClaimAction(viewClaim.id, "approved")}
                      disabled={updating === viewClaim.id}>
                      {updating === viewClaim.id ? <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" /> : <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      Re-approve
                    </Button>
                  )}
                  {viewClaim.status === "approved" && !disabledBizNames.has(`${viewClaim.name}||${viewClaim.barangay}`) && (
                    <Button size="sm" variant="outline" className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs text-muted-foreground"
                      onClick={() => { handleClaimAction(viewClaim.id, "disable"); setViewClaim(null); }}
                      disabled={updating === viewClaim.id}>
                      Disable
                    </Button>
                  )}
                  {viewClaim.status === "approved" && disabledBizNames.has(`${viewClaim.name}||${viewClaim.barangay}`) && (
                    <Button size="sm" className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs bg-water hover:bg-water/90"
                      onClick={() => { handleClaimAction(viewClaim.id, "enable"); setViewClaim(null); }}
                      disabled={updating === viewClaim.id}>
                      Enable
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="ml-auto h-7 sm:h-8 text-[10px] sm:text-xs"
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

function Pagination({ page, total, pageSize = 15, onChange, itemsCount }: { page: number; total: number; pageSize?: number; onChange: (p: number) => void; itemsCount?: number }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const visible = itemsCount ?? pageSize;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-[11px] text-muted-foreground">
        {visible === 0 ? 0 : page * pageSize + 1}–{page * pageSize + visible} of {total}
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

