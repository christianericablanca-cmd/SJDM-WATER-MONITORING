"use client";

import { useEffect, useState, useRef } from "react";

export function RainIndicator() {
  const [rain, setRain] = useState<number | null>(null);
  const [temp, setTemp] = useState<number | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - fetchedRef.current < 300_000) { setLoading(false); return; }
    fetchedRef.current = now;
    fetch("/api/weather")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setRain(typeof d.probability === "number" ? d.probability : null);
        setTemp(typeof d.temp === "number" ? d.temp : null);
        setCondition(typeof d.condition === "string" ? d.condition : null);
        setLoading(false);
      })
      .catch(() => { setRain(null); setLoading(false); });
  }, []);

  const isHigh = rain !== null && rain >= 60;
  const isMid = rain !== null && rain >= 30;
  const emoji = rain === null ? "☁️" : isHigh ? "🌧️" : isMid ? "🌦️" : "☀️";
  const rainLabel = loading ? "…" : rain !== null ? `${rain}%` : "—";
  const tempLabel = temp !== null ? `${Math.round(temp)}°` : "";

  return (
    <div
      className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs shadow-md border bg-background/85 backdrop-blur-sm"
      title={`${condition || "Weather"} · ${temp !== null ? `${Math.round(temp)}°C` : ""} · Rain chance today: ${rain !== null ? `${rain}%` : "N/A"}`}
    >
      <span className="text-sm">{emoji}</span>
      <div className="flex items-center gap-1">
        <span className={`font-medium tabular-nums ${isHigh ? "text-blue-600 dark:text-blue-400" : isMid ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
          {rainLabel}
        </span>
        {tempLabel && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-muted-foreground tabular-nums">{tempLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
