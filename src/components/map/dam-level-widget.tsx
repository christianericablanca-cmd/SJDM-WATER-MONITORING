"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Droplets, TrendingDown, TrendingUp, Loader2 } from "lucide-react";

interface DamLevel {
  name: string;
  level: number;
  normalHigh: number;
  date: string;
  deviation: number;
}

export function DamLevelWidget() {
  const [data, setData] = useState<DamLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<"live" | "fallback">("fallback");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    fetch("/api/dam-levels", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setData(d.dams || []);
        setSource(d.source || "fallback");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  if (loading) {
    return (
      <Card className="p-3 sm:p-4 shadow-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading dam levels…</span>
        </div>
      </Card>
    );
  }

  const angat = data.find((d) => d.name === "Angat");
  if (!angat) {
    return (
      <Card className="p-3 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Droplets className="h-4 w-4" />
          <span className="text-xs">Dam data unavailable</span>
        </div>
      </Card>
    );
  }

  const percentOfNormal = angat.normalHigh > 0 ? Math.round((angat.level / angat.normalHigh) * 100) : 0;
  const isLow = percentOfNormal < 80;
  const isCritical = percentOfNormal < 70;

  return (
    <Card className="p-3 sm:p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-water-muted flex items-center justify-center">
            <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-water" />
          </div>
          <h3 className="text-xs sm:text-sm font-semibold">Angat Dam</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            source === "live" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
          )}>
            {source === "live" ? "Live" : "Estimated"}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {angat.date || "Today"}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={cn(
            "text-xl sm:text-2xl font-bold tabular-nums",
            isCritical ? "text-destructive" : isLow ? "text-orange-500" : "text-emerald-500",
          )}>
            {angat.level.toFixed(2)}m
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            of {angat.normalHigh.toFixed(0)}m normal
          </p>
        </div>

        <div className="flex-1">
          <div className="w-full bg-muted rounded-full h-3 sm:h-4 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isCritical ? "bg-destructive" : isLow ? "bg-orange-500" : "bg-emerald-500",
              )}
              style={{ width: `${Math.min(percentOfNormal, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={cn(
              "text-[10px] sm:text-xs font-medium",
              isCritical ? "text-destructive" : isLow ? "text-orange-500" : "text-emerald-500",
            )}>
              {percentOfNormal}%
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              {angat.deviation < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {Math.abs(angat.deviation).toFixed(2)}m
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

