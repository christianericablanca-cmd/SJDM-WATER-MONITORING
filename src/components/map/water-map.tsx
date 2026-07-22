"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { WaterReport, Business, WaterProvider } from "@/lib/types";
import { SJDM_CENTER, ISSUE_EMOJI, ISSUE_TYPES, WATER_PROVIDERS, WATER_PROVIDER_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, ChevronDown, ChevronUp, Filter, Store, Phone, Truck, Clock } from "lucide-react";
import { timeSince } from "@/lib/utils";
import { BARANGAYS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

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

function createReportIcon(color: string) {
  if (typeof window === "undefined") return null;
  const L = require("leaflet");
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -14],
  });
}

function createBusinessIcon() {
  if (typeof window === "undefined") return null;
  const L = require("leaflet");
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="width:22px;height:22px;border-radius:4px;background:#059669;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;">🏪</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -16],
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  water_refilling: "Water Refilling",
  mineral_water_delivery: "Mineral Water Delivery",
  water_tanker: "Water Tanker",
  laundry_services: "Laundry",
};

function MapInner({ reports, businesses, reportIconCache, filteredReports, showBusinesses, businessesWithCoords, damData, lang }: {
  reports: WaterReport[];
  businesses: Business[];
  reportIconCache: Record<string, any>;
  filteredReports: WaterReport[];
  showBusinesses: boolean;
  businessesWithCoords: Business[];
  damData: { level: number; normalHigh: number; date: string } | null;
  lang: "en" | "tl";
}) {
  const mapRef = useRef<any>(null);
  const bizIcon = useMemo(() => createBusinessIcon(), []);
  const damIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    const L = require("leaflet");
    return new L.DivIcon({
      className: "custom-marker",
      html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:15px">💧</span></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -28],
    });
  }, []);
  const [key] = useState(() => `map-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => { mapRef.current.invalidateSize(); }, 200);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
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
                    report.status === "resolved" || report.status === "approved" || (report.status === "under_review" && report.verified) ? "success" :
                    report.status === "denied" ? "destructive" :
                    report.status === "stale" ? "secondary" :
                    report.status === "community_confirmed" ? "warning" :
                    report.status === "submitted" ? "outline" : "default"
                  } className="text-[10px] sm:text-xs px-1.5 py-0">
                    {(report.status === "under_review" && report.verified) ? STATUS_LABELS.approved : STATUS_LABELS[report.status] || report.status.replace("_", " ")}
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
                  <div className="relative w-full h-28 sm:h-32 rounded-md overflow-hidden bg-muted -mx-0.5">
                    <img src={report.photo_url} alt="Report photo" className="w-full h-full object-cover"
                      loading="lazy" />
                  </div>
                )}
                {report.description && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {report.description}
                  </div>
                )}
                {report.confirmation_count !== undefined && report.confirmation_count > 0 && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    ✓ {report.confirmation_count} confirmation{report.confirmation_count !== 1 ? "s" : ""}
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
      {showBusinesses && bizIcon && businessesWithCoords.map((biz) => (
        <Marker key={biz.id} position={[biz.latitude!, biz.longitude!]} icon={bizIcon}>
          <Popup>
            <div className="space-y-1.5 min-w-[190px] max-w-[250px]">
              {biz.photo_url && (
                <div className="w-full h-24 rounded-md overflow-hidden -mx-0.5">
                  <img src={biz.photo_url} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
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
      ))}
    </MapContainer>
  );
}

export function WaterMap({ reports, businesses }: WaterMapProps) {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");
  const [issueFilter, setIssueFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(typeof window !== "undefined" && window.innerWidth >= 640);
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [damData, setDamData] = useState<{ level: number; normalHigh: number; date: string } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/dam-levels")
      .then((r) => r.json())
      .then((d) => {
        const angat = (d.dams || []).find((dam: any) => dam.name === "Angat");
        if (angat) setDamData(angat);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mounted || !wrapperRef.current) return;
    const el = wrapperRef.current.querySelector(".leaflet-container") as any;
    if (el && el._leaflet_id) {
      setTimeout(() => { el._leaflet_map?.invalidateSize(); }, 100);
    }
  }, [mounted]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (barangayFilter !== "all" && r.barangay !== barangayFilter) return false;
      if (issueFilter !== "all" && r.issue_type !== issueFilter) return false;
      if (providerFilter !== "all" && (r.water_provider || "unknown") !== providerFilter) return false;
      if (search && !r.barangay.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [reports, barangayFilter, issueFilter, providerFilter, search]);

  const businessesWithCoords = useMemo(() => {
    return businesses.filter((b) => b.latitude != null && b.longitude != null);
  }, [businesses]);

  const reportIconCache = useMemo(() => {
    const cache: Record<string, any> = {};
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
          <span className="text-muted-foreground hidden sm:inline">{t("of", lang)} {reports.length} {t("reports", lang)}</span>
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex overflow-x-auto gap-2 sm:gap-2.5 pb-1 text-[10px] sm:text-xs text-muted-foreground -mx-1 px-1 flex-1">
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
          <span className="tabular-nums">{businessesWithCoords.length}</span>
        </button>
      </div>

      {/* Map */}
      <div className="h-[55vh] min-h-[350px] sm:h-[600px] xl:h-[700px] rounded-xl border overflow-hidden shadow-card relative bg-muted isolate">
        {mounted ? (
          <MapInner
            reports={reports}
            businesses={businesses}
            reportIconCache={reportIconCache}
            filteredReports={filteredReports}
            showBusinesses={showBusinesses}
            businessesWithCoords={businessesWithCoords}
            damData={damData}
            lang={lang}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {t("Loading map…", lang)}
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
