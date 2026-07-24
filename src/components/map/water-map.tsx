"use client";

import { useEffect, useMemo, useState, useRef, memo } from "react";
import dynamic from "next/dynamic";
import type { WaterReport, Business, WaterProvider, Barangay, IssueType, ReportStatus } from "@/lib/types";
import { SJDM_CENTER, ISSUE_EMOJI, ISSUE_TYPES, WATER_PROVIDERS, WATER_PROVIDER_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, ChevronDown, ChevronUp, Filter, Store, Phone, Truck, Clock, Layers, RefreshCw, Info } from "lucide-react";
import { cn, timeSince } from "@/lib/utils";
import { BARANGAYS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { BarangayBoundaries } from "./barangay-boundaries";
import { RainIndicator } from "./rain-indicator";
import { useMap } from "react-leaflet";
import { createClient } from "@/lib/supabase/client";
import L from "leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

const MARKER_COLORS: Record<string, string> = {
  no_water: "#dc2626",
  low_pressure: "#ea580c",
  dirty_water: "#a16207",
  water_leak: "#2563eb",
  pipe_infrastructure: "#7c3aed",
  other: "#6b7280",
};

interface WaterMapProps {
  reports: WaterReport[];
  businesses: Business[];
}

function createReportIcon(color: string): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -14],
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  water_refilling: "#3b82f6",
  water_tanker: "#f97316",
  water_storage: "#10b981",
  laundry_services: "#a855f7",
};

const CATEGORY_SVG: Record<string, string> = {
  water_refilling: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  water_tanker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H4v12h1"/><path d="M14 9h4l3 3v5h-1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
  water_storage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8c0 1.1 4.5 2 10 2s10-.9 10-2"/><path d="M2 8v8c0 1.1 4.5 2 10 2s10-.9 10-2V8"/><path d="M2 12c0 1.1 4.5 2 10 2s10-.9 10-2"/></svg>`,
  laundry_services: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><circle cx="9" cy="7" r="1"/></svg>`,
};

function createBusinessIcon(category: string): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  const color = CATEGORY_COLORS[category] || "#6b7280";
  const svg = CATEGORY_SVG[category] || "";
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="width:24px;height:24px;border-radius:5px;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;padding:3px;">${svg}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -18],
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  water_refilling: "Water Refilling & Delivery",
  water_tanker: "Water Tanker",
  water_storage: "Water Storage",
  laundry_services: "Laundry",
};

const BoundaryLayer = memo(function BoundaryLayer({ visible, lang }: { visible: boolean; lang: "en" | "tl" }) {
  const map = useMap();
  return <BarangayBoundaries map={map} visible={visible} lang={lang} />;
});

const MapInner = memo(function MapInner({ reports, businesses, reportIconCache, filteredReports, showBusinesses, showBoundaries, businessesWithCoords, damData, lang, onPhotoClick, onBusinessPhotoClick }: {
  reports: WaterReport[];
  businesses: Business[];
  reportIconCache: Record<string, L.DivIcon | null>;
  filteredReports: WaterReport[];
  showBusinesses: boolean;
  showBoundaries: boolean;
  businessesWithCoords: Business[];
  damData: { level: number; normalHigh: number; date: string } | null;
  lang: "en" | "tl";
  onPhotoClick: (report: WaterReport) => void;
  onBusinessPhotoClick: (business: Business) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const bizIcons = useMemo(() => {
    const cats = ["water_refilling", "water_tanker", "water_storage", "laundry_services"];
    const map: Record<string, L.DivIcon | null> = {};
    for (const c of cats) map[c] = createBusinessIcon(c);
    return map;
  }, []);
  const damIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new L.DivIcon({
      className: "custom-marker",
      html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:15px">💧</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -28],
    });
  }, []);
  const [key] = useState(() => `map-${crypto.randomUUID()}`);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setTimeout(() => { map.invalidateSize(); }, 200);
    }
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <MapContainer
      key={key}
      ref={mapRef}
      center={[SJDM_CENTER.lat, SJDM_CENTER.lng]}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundaryLayer visible={showBoundaries} lang={lang} />
      {damData && damIcon && (
        <Marker position={[14.9102, 121.1605]} icon={damIcon}>
          <Popup>
            <div className="space-y-1 min-w-[160px]">
              <span className="font-semibold text-sm">Angat Dam</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-blue-600">{damData.level.toFixed(2)}m</span>
                <span className="text-[10px] text-muted-foreground">of {damData.normalHigh.toFixed(0)}m</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(Math.round((damData.level / damData.normalHigh) * 100), 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{damData.date}</p>
            </div>
          </Popup>
        </Marker>
      )}
      {filteredReports.map((report) => {
        const icon = reportIconCache[report.issue_type];
        if (!icon) return null;
        return (
          <Marker key={report.id} position={[report.latitude, report.longitude]} icon={icon}>
            <Popup>
              <div className="space-y-1 min-w-[170px] max-w-[220px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs sm:text-sm">{report.barangay}</span>
                  <Badge variant={
                    report.status === "approved" || report.status === "resolved" ? "success" :
                    report.status === "denied" ? "destructive" :
                    report.status === "stale" ? "secondary" : "default"
                  } className="text-[10px] sm:text-xs px-1.5 py-0">
                    {STATUS_LABELS[report.status] || report.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs sm:text-sm">
                  {ISSUE_EMOJI[report.issue_type]} {t(ISSUE_TYPES.find(i => i.value === report.issue_type)?.label || report.issue_type, lang)}
                </div>
                {report.water_provider && (
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground/75">
                    {WATER_PROVIDER_LABELS[report.water_provider] || report.water_provider}
                  </div>
                )}
                {report.photo_url && (
                  <button onClick={() => onPhotoClick(report)} className="relative w-full h-28 sm:h-32 rounded-md overflow-hidden bg-muted -mx-0.5 p-0 border-0 block cursor-pointer text-left">
                    <img src={report.photo_url} alt="Report photo" className="w-full h-full object-cover"
                      loading="lazy" />
                  </button>
                )}
                {report.description && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {report.description}
                  </div>
                )}
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {timeSince(report.created_at)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {showBusinesses && businessesWithCoords.map((biz) => {
        const bizIcon = bizIcons[biz.category] || bizIcons.water_refilling;
        return bizIcon && (
        <Marker key={biz.id} position={[biz.latitude!, biz.longitude!]} icon={bizIcon}>
          <Popup>
            <div className="space-y-1.5 min-w-[190px] max-w-[250px]">
              {biz.photo_url && (
                <button onClick={() => onBusinessPhotoClick(biz)} className="w-full h-24 rounded-md overflow-hidden -mx-0.5 p-0 border-0 block cursor-pointer">
                  <img src={biz.photo_url} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                </button>
              )}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{biz.name}</span>
                {biz.verified && (
                  <Badge variant="success" className="text-[8px] px-1 py-0">Verified</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[biz.category] || biz.category}</p>
              <p className="text-[11px] text-muted-foreground">{biz.address}, {biz.barangay}</p>
              {biz.contact && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{biz.contact}</span>
                </div>
              )}
              {biz.operating_hours && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{biz.operating_hours}</span>
                </div>
              )}
              {biz.delivery_available && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <Truck className="h-3 w-3 shrink-0" />
                  <span>Delivery available</span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
        );
      })}
    </MapContainer>
  );
});

export function WaterMap({ reports, businesses }: WaterMapProps) {
  const { lang } = useLanguage();
  const [liveReports, setLiveReports] = useState<WaterReport[]>(reports);
  const [liveBusinesses, setLiveBusinesses] = useState<Business[]>(businesses);
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => { if (window.innerWidth >= 640) setShowFilters(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [damData, setDamData] = useState<{ level: number; normalHigh: number; date: string } | null>(null);
  const [previewReport, setPreviewReport] = useState<WaterReport | null>(null);
  const [previewBusiness, setPreviewBusiness] = useState<Business | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [rtConnected, setRtConnected] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const knownBizIdsRef = useRef<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const report: WaterReport = {
            id: String(r.id),
            barangay: r.barangay as Barangay,
            latitude: r.latitude as number,
            longitude: r.longitude as number,
            issue_type: r.issue_type as IssueType,
            description: r.description as string,
            photo_url: r.photo_url as string | null,
            street_sitio: r.street_sitio as string | null,
            status: r.status as ReportStatus,
            report_id_display: r.report_id_display as string,
            started_at: r.started_at as string,
            created_at: r.created_at as string,
            resolved_at: r.resolved_at as string | null,
            confirmation_count: (r.confirmation_count as number) || 0,
            water_provider: r.water_provider as WaterProvider,
            verified: r.verified as boolean,
            denied: r.denied as boolean,
          };
          setLiveReports((prev) => {
            if (prev.some((p) => p.id === report.id)) return prev;
            return [report, ...prev];
          });
          setLiveCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          setLiveReports((prev) =>
            prev.map((p) =>
              p.id === String(r.id)
                ? {
                    ...p,
                    barangay: (r.barangay as Barangay) ?? p.barangay,
                    latitude: (r.latitude as number) ?? p.latitude,
                    longitude: (r.longitude as number) ?? p.longitude,
                    issue_type: (r.issue_type as IssueType) ?? p.issue_type,
                    description: (r.description as string | null | undefined) ?? p.description,
                    photo_url: (r.photo_url as string | null | undefined) ?? p.photo_url,
                    street_sitio: (r.street_sitio as string | null | undefined) ?? p.street_sitio,
                    status: (r.status as ReportStatus) ?? p.status,
                    report_id_display: (r.report_id_display as string | null | undefined) ?? p.report_id_display,
                    started_at: (r.started_at as string | null | undefined) ?? p.started_at,
                    created_at: (r.created_at as string) ?? p.created_at,
                    resolved_at: (r.resolved_at as string | null | undefined) ?? p.resolved_at,
                    confirmation_count: (r.confirmation_count as number | undefined) ?? p.confirmation_count,
                    water_provider: (r.water_provider as WaterProvider | null | undefined) ?? p.water_provider,
                    verified: (r.verified as boolean | undefined) ?? p.verified,
                    denied: (r.denied as boolean | undefined) ?? p.denied,
                  }
                : p,
            )
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRtConnected(true);
      });

    const bizChannel = supabase
      .channel("businesses-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "businesses" },
        (payload) => {
          const b = payload.new as Record<string, unknown>;
          setLiveBusinesses((prev) => {
            if (prev.some((p) => p.id === b.id)) return prev;
            return [...prev, b as unknown as Business];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "businesses" },
        (payload) => {
          const b = payload.new as Record<string, unknown>;
          setLiveBusinesses((prev) =>
            prev.map((p) => (p.id === b.id ? (b as unknown as Business) : p)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "businesses" },
        (payload) => {
          const b = payload.old as Record<string, unknown>;
          setLiveBusinesses((prev) => prev.filter((p) => p.id !== b.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(bizChannel);
    };
  }, []);

  useEffect(() => {
    knownIdsRef.current = new Set(liveReports.map((r) => r.id));
  }, [reports]);

  useEffect(() => {
    knownBizIdsRef.current = new Set(liveBusinesses.map((b) => b.id));
  }, [businesses]);

  useEffect(() => {
    if (liveCount > 0) {
      const timer = setTimeout(() => setLiveCount(0), 4000);
      return () => clearTimeout(timer);
    }
  }, [liveCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("reports")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        if (!data) return;
        const prevIds = knownIdsRef.current;
        const newIds = new Set<string>();
        let added = 0;
        let updated = 0;
        for (const r of data) {
          const id = String(r.id);
          newIds.add(id);
          if (!prevIds.has(id)) {
            const report: WaterReport = {
              id,
              barangay: r.barangay,
              latitude: r.latitude,
              longitude: r.longitude,
              issue_type: r.issue_type,
              description: r.description,
              photo_url: r.photo_url,
              street_sitio: r.street_sitio,
              status: r.status,
              report_id_display: r.report_id_display,
              started_at: r.started_at,
              created_at: r.created_at,
              resolved_at: r.resolved_at,
              confirmation_count: r.confirmation_count || 0,
              water_provider: r.water_provider,
              verified: r.verified,
              denied: r.denied,
            };
            setLiveReports((prev) => (prev.some((p) => p.id === id) ? prev : [report, ...prev]));
            added++;
          } else {
            setLiveReports((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      barangay: r.barangay,
                      latitude: r.latitude,
                      longitude: r.longitude,
                      issue_type: r.issue_type,
                      description: r.description,
                      photo_url: r.photo_url,
                      street_sitio: r.street_sitio,
                      status: r.status,
                      report_id_display: r.report_id_display,
                      started_at: r.started_at,
                      created_at: r.created_at,
                      resolved_at: r.resolved_at,
            confirmation_count: (r.confirmation_count as number) || 0,
                      water_provider: r.water_provider,
                      verified: r.verified,
                      denied: r.denied,
                    }
                  : p,
              ),
            );
            updated++;
          }
        }
        knownIdsRef.current = newIds;
        const totalChanges = added + updated;
        if (totalChanges > 0) setLiveCount((c) => c + totalChanges);
      } catch {
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("businesses")
          .select("*")
          .order("name");
        if (!data) return;
        const prevIds = knownBizIdsRef.current;
        const newIds = new Set<string>();
        for (const b of data) {
          const id = String(b.id);
          newIds.add(id);
          if (!prevIds.has(id)) {
            setLiveBusinesses((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, b as Business]));
          } else {
            setLiveBusinesses((prev) =>
              prev.map((p) => (p.id === id ? (b as Business) : p)),
            );
          }
        }
        const removed = [...prevIds].filter((id) => !newIds.has(id));
        if (removed.length > 0) {
          setLiveBusinesses((prev) => prev.filter((p) => !removed.includes(p.id)));
        }
        knownBizIdsRef.current = newIds;
      } catch {
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/dam-levels")
      .then((r) => r.json())
      .then((d: Record<string, unknown>) => {
        const dams = d.dams as Array<Record<string, unknown>> | undefined;
        const angat = (dams || []).find((dam) => dam.name === "Angat");
        if (angat) setDamData(angat as { level: number; normalHigh: number; date: string });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted || !wrapperRef.current) return;
    const el = wrapperRef.current.querySelector<HTMLElement & { _leaflet_id?: number; _leaflet_map?: L.Map }>(".leaflet-container");
    if (el && el._leaflet_id) {
      setTimeout(() => { el._leaflet_map?.invalidateSize(); }, 100);
    }
  }, [mounted]);

  const filteredReports = useMemo(() => {
    return liveReports.filter((r) => {
      if (barangayFilter !== "all" && r.barangay !== barangayFilter) return false;
      if (issueFilter !== "all" && r.issue_type !== issueFilter) return false;
      if (providerFilter !== "all" && (r.water_provider || "unknown") !== providerFilter) return false;
      if (search && !r.barangay.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [liveReports, barangayFilter, issueFilter, providerFilter, search]);

  const businessesWithCoords = useMemo(() => {
    return liveBusinesses.filter((b) => b.latitude != null && b.longitude != null);
  }, [liveBusinesses]);

  const reportIconCache = useMemo(() => {
    const cache: Record<string, L.DivIcon | null> = {};
    if (typeof window === "undefined") return cache;
    for (const [key, color] of Object.entries(MARKER_COLORS)) {
      cache[key] = createReportIcon(color);
    }
    return cache;
  }, []);

  return (
    <div className="space-y-2 sm:space-y-3" ref={wrapperRef}>
      {/* Count + filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0">
          <MapPin className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-water shrink-0" />
          <span className="font-medium tabular-nums">{filteredReports.length}</span>
          <span className="text-muted-foreground hidden sm:inline">{t("of", lang)} {liveReports.length} {t("reports", lang)}</span>
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse">
              <RefreshCw className="h-3 w-3" />
              +{liveCount} new
            </span>
          )}
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <RefreshCw className="h-2.5 w-2.5" />
            live
          </span>
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
            <Store className="h-2.5 w-2.5" />
            {businessesWithCoords.length}
          </span>
          <span className="text-muted-foreground text-[10px] sm:text-xs truncate">
            · {new Set(filteredReports.map((r) => r.barangay)).size} {t("barangays", lang)}
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 px-2 -mr-2 min-h-[44px]"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("Filters", lang)}</span>
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("Search barangay…", lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 sm:h-9 text-sm"
            />
          </div>
          <Select value={barangayFilter} onValueChange={setBarangayFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 sm:h-9 text-sm">
              <SelectValue placeholder="Barangay" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Barangays", lang)}</SelectItem>
              {BARANGAYS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={issueFilter} onValueChange={setIssueFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-9 text-sm">
              <SelectValue placeholder={t("Issue type", lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Issues", lang)}</SelectItem>
              {ISSUE_TYPES.map((issue) => (
                <SelectItem key={issue.value} value={issue.value}>{issue.emoji} {t(issue.label, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-full sm:w-[190px] h-11 sm:h-9 text-sm">
              <SelectValue placeholder={t("Water provider", lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Providers", lang)}</SelectItem>
              {WATER_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Legend + services toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLegendOpen(true)}
            className="sm:hidden flex items-center gap-1.5 text-[10px] py-2 px-2.5 rounded-lg border transition-colors shrink-0 min-h-[44px] bg-muted border-border text-muted-foreground"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Legend</span>
          </button>
          <div className="hidden sm:flex overflow-x-auto gap-2 sm:gap-2.5 pb-1 text-[10px] sm:text-xs text-muted-foreground -mx-1 px-1 flex-1">
            {ISSUE_TYPES.map((issue) => (
              <div key={issue.value} className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MARKER_COLORS[issue.value] }} />
                {t(issue.label, lang)}
              </div>
            ))}
            <span className="text-muted-foreground shrink-0 mx-0.5">|</span>
            <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
              <span className="text-sm">💧</span>
              {t("Angat Dam", lang)}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowBoundaries(!showBoundaries)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-2.5 rounded-lg border transition-colors shrink-0 min-h-[44px]",
                showBoundaries
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("Boundaries", lang)}</span>
            </button>
            <button
              onClick={() => setShowBusinesses(!showBusinesses)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-2.5 rounded-lg border transition-colors shrink-0 min-h-[44px]",
                showBusinesses
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Services</span>
              <span className="tabular-nums">{filteredReports.length}</span>
            </button>
          </div>
      </div>

      {/* Service legend — desktop only */}
      <div className="hidden sm:flex overflow-x-auto gap-2 sm:gap-2.5 pb-1 text-[10px] sm:text-xs text-muted-foreground -mx-1 px-1">
        {(["water_refilling", "water_tanker", "water_storage", "laundry_services"] as const).map((cat) => (
          <div key={cat} className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            {CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>
      </div>

      <Dialog open={legendOpen} onOpenChange={setLegendOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Map Legend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Issue Types</p>
              <div className="space-y-2">
                {ISSUE_TYPES.map((issue) => (
                  <div key={issue.value} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: MARKER_COLORS[issue.value] }} />
                    {issue.label}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm pt-1 border-t border-border">
                  <span className="text-base">💧</span>
                  Angat Dam
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Services</p>
              <div className="space-y-2">
                {(["water_refilling", "water_tanker", "water_storage", "laundry_services"] as const).map((cat) => (
                  <div key={cat} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    {CATEGORY_LABELS[cat]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map */}
      <div className="h-[55vh] min-h-[350px] sm:h-[600px] xl:h-[700px] rounded-xl border overflow-hidden shadow-card relative bg-muted isolate">
        {mounted ? (
          <>
          <MapInner
            reports={reports}
            businesses={businesses}
            reportIconCache={reportIconCache}
            filteredReports={filteredReports}
            showBusinesses={showBusinesses}
            showBoundaries={showBoundaries}
            businessesWithCoords={businessesWithCoords}
            damData={damData}
            lang={lang}
            onPhotoClick={setPreviewReport}
            onBusinessPhotoClick={setPreviewBusiness}
          />
          <RainIndicator />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {t("Loading map…", lang)}
          </div>
        )}
      </div>

      {/* Business photo preview modal */}
      {previewBusiness && previewBusiness.photo_url && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewBusiness(null)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full aspect-video bg-muted">
              <img src={previewBusiness.photo_url} alt={previewBusiness.name} className="w-full h-full object-contain" />
              <button onClick={() => setPreviewBusiness(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70">✕</button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{previewBusiness.name}</span>
                {previewBusiness.verified && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0">Verified</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[previewBusiness.category] || previewBusiness.category}</p>
              <p className="text-xs text-muted-foreground">{previewBusiness.address}, {previewBusiness.barangay}</p>
              {previewBusiness.contact && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{previewBusiness.contact}</span>
                </div>
              )}
              {previewBusiness.operating_hours && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{previewBusiness.operating_hours}</span>
                </div>
              )}
              {previewBusiness.delivery_available && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Truck className="h-3 w-3 shrink-0" />
                  <span>Delivery available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report photo preview modal */}
      {previewReport && previewReport.photo_url && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewReport(null)}>
          <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full aspect-video bg-muted">
              <img src={previewReport.photo_url} alt="Report" className="w-full h-full object-contain" />
              <button onClick={() => setPreviewReport(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/70">✕</button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{ISSUE_EMOJI[previewReport.issue_type]}</span>
                  <span className="font-semibold text-sm">{previewReport.barangay}</span>
                </div>
                <Badge variant={
                  previewReport.status === "approved" || previewReport.status === "resolved" ? "success" :
                  previewReport.status === "denied" ? "destructive" :
                  previewReport.status === "stale" ? "secondary" : "default"
                } className="text-[10px] px-1.5 py-0">
                  {STATUS_LABELS[previewReport.status] || previewReport.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{t(ISSUE_TYPES.find(i => i.value === previewReport.issue_type)?.label || previewReport.issue_type, lang)}</p>
              {previewReport.water_provider && (
                <p className="text-xs text-muted-foreground/75">{WATER_PROVIDER_LABELS[previewReport.water_provider] || previewReport.water_provider}</p>
              )}
              {previewReport.description && (
                <p className="text-sm leading-relaxed">{previewReport.description}</p>
              )}
              <div className="text-[10px] text-muted-foreground pt-1">
                <span>{timeSince(previewReport.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

