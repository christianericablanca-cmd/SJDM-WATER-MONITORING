"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { LocateFixed, MapPin, Loader2 } from "lucide-react";
import { BARANGAY_COORDS } from "@/lib/constants";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });

interface LocationPickerProps {
  barangay: string;
  onPin: (lat: number, lng: number) => void;
  lat: number | null;
  lng: number | null;
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^sta/, "santa").replace(/^sto/, "santo");
}

function findMatchingFeatures(geojson: any, barangayName: string): any[] {
  const normalized = normalize(barangayName);
  return (geojson.features || []).filter((f: any) => {
    const ad4 = f.properties?.ADM4_EN || "";
    const n = normalize(ad4);
    return n === normalized || n.startsWith(normalized);
  });
}

function computeCentroid(geojson: any, barangayName: string): { lat: number; lng: number } | null {
  if (!geojson || typeof window === "undefined") return null;
  const features = findMatchingFeatures(geojson, barangayName);
  if (features.length > 0) {
    let allPoints: [number, number][] = [];
    for (const feature of features) {
      const coords = feature.geometry.coordinates;
      if (feature.geometry.type === "Polygon") {
        coords[0].forEach((c: number[]) => allPoints.push([c[1], c[0]]));
      } else if (feature.geometry.type === "MultiPolygon") {
        coords.forEach((poly: number[][][]) => {
          poly[0].forEach((c: number[]) => allPoints.push([c[1], c[0]]));
        });
      }
    }
    if (allPoints.length > 0) {
      const latSum = allPoints.reduce((s, p) => s + p[0], 0);
      const lngSum = allPoints.reduce((s, p) => s + p[1], 0);
      return { lat: latSum / allPoints.length, lng: lngSum / allPoints.length };
    }
  }
  const fallback = BARANGAY_COORDS[barangayName as keyof typeof BARANGAY_COORDS];
  if (fallback) return { lat: fallback.lat, lng: fallback.lng };
  return null;
}

function MapInner({
  pos,
  onPin,
  geojsonData,
  barangay,
  mapRef,
}: {
  pos: { lat: number; lng: number };
  onPin: (lat: number, lng: number) => void;
  geojsonData: any;
  barangay: string;
  mapRef: any;
}) {
  const markerRef = useRef<any>(null);
  const boundaryLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !geojsonData || typeof window === "undefined") return;
    const L = require("leaflet");
    if (boundaryLayerRef.current) {
      mapRef.current.removeLayer(boundaryLayerRef.current);
    }
    const features = findMatchingFeatures(geojsonData, barangay);
    if (features.length > 0) {
      const layer = L.geoJSON({ type: "FeatureCollection", features }, {
        style: {
          fillColor: "#1d7abf",
          color: "#1d7abf",
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.15,
        },
      });
      layer.addTo(mapRef.current);
      mapRef.current.fitBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 15 });
      boundaryLayerRef.current = layer;
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
    }
    return () => {
      if (boundaryLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(boundaryLayerRef.current);
        boundaryLayerRef.current = null;
      }
    };
  }, [geojsonData, barangay, mapRef, pos.lat, pos.lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([pos.lat, pos.lng], mapRef.current.getZoom(), { animate: true });
  }, [pos.lat, pos.lng]);

  const icon = useMemo(() => {
    if (typeof window === "undefined") return null;
    const L = require("leaflet");
    return new L.DivIcon({
      className: "custom-marker",
      html: `<div style="width:20px;height:20px;border-radius:50%;background:#1d7abf;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const ll = marker.getLatLng();
          onPin(ll.lat, ll.lng);
        }
      },
    }),
    [onPin],
  );

  return (
    <MapContainer
      ref={mapRef}
      center={[pos.lat, pos.lng]}
      zoom={14}
      className="h-full w-full"
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {icon && (
        <Marker
          draggable
          ref={markerRef}
          position={[pos.lat, pos.lng]}
          icon={icon}
          eventHandlers={eventHandlers}
        />
      )}
    </MapContainer>
  );
}

export function LocationPicker({ barangay, onPin, lat, lng }: LocationPickerProps) {
  const { lang } = useLanguage();
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<any>(null);
  const lastBarangayRef = useRef("");

  const pos = useMemo(() => {
    if (lat && lng && lastBarangayRef.current === barangay) {
      return { lat, lng };
    }
    if (!barangay) return { lat: 14.8136, lng: 121.0453 };
    const centroid = geojsonData ? computeCentroid(geojsonData, barangay) : null;
    if (centroid) return centroid;
    return { lat: 14.8136, lng: 121.0453 };
  }, [lat, lng, geojsonData, barangay]);

  useEffect(() => {
    if (!geojsonData || !barangay) return;
    const centroid = computeCentroid(geojsonData, barangay);
    if (centroid) {
      lastBarangayRef.current = barangay;
      onPin(centroid.lat, centroid.lng);
    }
  }, [barangay, geojsonData]);

  useEffect(() => {
    fetch("/data/sjdm-barangays.geojson")
      .then((r) => r.json())
      .then((d) => setGeojsonData(d))
      .catch(() => {});
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastBarangayRef.current = barangay;
        onPin(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="h-52 sm:h-60 rounded-lg border overflow-hidden relative bg-muted z-0">
        <MapInner
          pos={pos}
          onPin={onPin}
          geojsonData={geojsonData}
          barangay={barangay}
          mapRef={mapRef}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : t("Pin will be placed at the barangay center", lang)}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="gap-1.5 h-8 text-xs shrink-0"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          {t("Use my location", lang)}
        </Button>
      </div>
    </div>
  );
}
