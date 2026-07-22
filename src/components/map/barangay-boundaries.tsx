"use client";

import { useEffect, useState, useRef } from "react";

const BARANGAY_COLORS = [
  "#e8f5e9", "#fce4ec", "#e3f2fd", "#fff3e0", "#f3e5f5",
  "#e0f2f1", "#fbe9e7", "#e8eaf6", "#fff8e1", "#f1f8e9",
  "#fce4ec", "#e0f7fa", "#fef9e7", "#e8f5e9", "#f3e5f5",
  "#e3f2fd", "#fbe9e7", "#fff3e0", "#e0f2f1", "#e8eaf6",
  "#fff8e1", "#f1f8e9", "#fce4ec", "#e0f7fa", "#fef9e7",
  "#e8f5e9", "#f3e5f5", "#e3f2fd", "#fbe9e7", "#fff3e0",
  "#e0f2f1", "#e8eaf6", "#fff8e1", "#f1f8e9", "#fce4ec",
  "#e0f7fa", "#fef9e7", "#e8f5e9", "#f3e5f5", "#e3f2fd",
  "#fbe9e7", "#fff3e0", "#e0f2f1", "#e8eaf6", "#fff8e1",
  "#f1f8e9", "#fce4ec", "#e0f7fa", "#fef9e7", "#e8f5e9",
  "#f3e5f5", "#e3f2fd", "#fbe9e7", "#fff3e0", "#e0f2f1",
  "#e8eaf6", "#fff8e1", "#f1f8e9", "#fce4ec", "#e0f7fa",
  "#fef9e7", "#e8f5e9",
];

const STROKE_COLORS = [
  "#a5d6a7", "#ef9a9a", "#90caf9", "#ffcc80", "#ce93d8",
  "#80cbc4", "#ffab91", "#9fa8da", "#ffe082", "#c5e1a5",
  "#ef9a9a", "#80deea", "#ffe58f", "#a5d6a7", "#ce93d8",
  "#90caf9", "#ffab91", "#ffcc80", "#80cbc4", "#9fa8da",
  "#ffe082", "#c5e1a5", "#ef9a9a", "#80deea", "#ffe58f",
  "#a5d6a7", "#ce93d8", "#90caf9", "#ffab91", "#ffcc80",
  "#80cbc4", "#9fa8da", "#ffe082", "#c5e1a5", "#ef9a9a",
  "#80deea", "#ffe58f", "#a5d6a7", "#ce93d8", "#90caf9",
  "#ffab91", "#ffcc80", "#80cbc4", "#9fa8da", "#ffe082",
  "#c5e1a5", "#ef9a9a", "#80deea", "#ffe58f", "#a5d6a7",
  "#ce93d8", "#90caf9", "#ffab91", "#ffcc80", "#80cbc4",
  "#9fa8da", "#ffe082", "#c5e1a5", "#ef9a9a", "#80deea",
  "#ffe58f", "#a5d6a7",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface BarangayBoundariesProps {
  map: any;
  visible: boolean;
  lang: "en" | "tl";
}

export function BarangayBoundaries({ map, visible, lang }: BarangayBoundariesProps) {
  const layerRef = useRef<any>(null);
  const dataRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (dataRef.current) return;
    fetch("/data/sjdm-barangays.geojson")
      .then((r) => r.json())
      .then((data) => {
        dataRef.current = data;
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!map || !loaded || !dataRef.current || typeof window === "undefined") return;
    const L = require("leaflet");

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!visible) return;

    const geoLayer = L.geoJSON(dataRef.current, {
      style: (feature: any) => {
        const name = feature?.properties?.ADM4_EN || "";
        const idx = hashCode(name) % BARANGAY_COLORS.length;
        return {
          fillColor: BARANGAY_COLORS[idx],
          color: STROKE_COLORS[idx],
          weight: 1.5,
          opacity: 0.8,
          fillOpacity: 0.35,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const name = feature?.properties?.ADM4_EN || "";
        layer.on({
          mouseover: (e: any) => {
            const target = e.target;
            target.setStyle({ fillOpacity: 0.6, weight: 2.5, opacity: 1 });
            if (target.getTooltip()) target.closeTooltip();
            target.bindTooltip(name, {
              direction: "center",
              className: "brgy-tooltip",
              offset: L.point(0, 0),
            }).openTooltip();
          },
          mouseout: (e: any) => {
            const target = e.target;
            const idx = hashCode(name) % BARANGAY_COLORS.length;
            target.setStyle({
              fillColor: BARANGAY_COLORS[idx],
              color: STROKE_COLORS[idx],
              weight: 1.5,
              opacity: 0.8,
              fillOpacity: 0.35,
            });
            if (target.getTooltip()) target.closeTooltip();
          },
          click: () => {
          },
        });
      },
    });

    geoLayer.addTo(map);
    layerRef.current = geoLayer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, visible, loaded, lang]);

  return null;
}
