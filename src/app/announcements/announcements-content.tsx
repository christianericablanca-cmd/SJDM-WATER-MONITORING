"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Building2, ImageOff, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Announcement {
  id: string;
  title: string;
  content: string;
  source: string;
  is_official: boolean;
  created_at: string;
  image_url?: string | null;
}

interface AnnouncementsContentProps {
  announcements: Announcement[];
  total: number;
  pageSize: number;
}

function AnnounceCard({ a, lang }: { a: Announcement; lang: "en" | "tl" }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="shadow-card border-border/60 overflow-hidden flex flex-col sm:flex-row w-full mx-auto">
      {a.image_url && !imgError ? (
        <div className="relative w-full sm:w-[360px] lg:w-[440px] shrink-0 bg-muted overflow-hidden" style={{ minHeight: 280 }}>
          <Image src={a.image_url} alt={a.title} fill className="object-contain p-2" onError={() => setImgError(true)} />
        </div>
      ) : a.image_url && imgError ? (
        <div className="w-full sm:w-[360px] lg:w-[440px] shrink-0 bg-muted flex items-center justify-center" style={{ minHeight: 280 }}>
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        </div>
      ) : null}
      <div className="flex flex-col flex-1 min-w-0 px-4 sm:px-6 py-4 justify-center">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={a.is_official ? "default" : "secondary"} className="text-[11px] px-2 py-0.5">
            {a.is_official ? t("Official", lang) : t("Community", lang)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-semibold leading-snug mb-2">{a.title}</h3>
        {a.is_official && (
          <p className="text-xs text-muted-foreground mb-2">
            {t("Source:", lang)} {a.source}
          </p>
        )}
        <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">{a.content}</p>
      </div>
    </Card>
  );
}

export function AnnouncementsContent({ announcements: initial, total, pageSize }: AnnouncementsContentProps) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<Announcement[]>(initial);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const loaded = items.length;
  const hasMore = loaded < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements?offset=${loaded}&limit=${pageSize}`);
      if (!res.ok) throw new Error();
      const data: Announcement[] = await res.json();
      setItems((prev) => [...prev, ...data]);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [loaded, loading, hasMore, pageSize]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/announcements?offset=0&limit=${pageSize}`);
      if (!res.ok) throw new Error();
      const data: Announcement[] = await res.json();
      setItems(data);
    } catch {
      // silently fail
    }
    setRefreshing(false);
    setPullDistance(0);
  }, [pageSize]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Pull-to-refresh (mobile)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      touchCurrentY.current = e.touches[0].clientY;
      const dist = touchCurrentY.current - touchStartY.current;
      if (dist > 0) setPullDistance(Math.min(dist * 0.4, 80));
    };

    const onTouchEnd = () => {
      if (pullDistance > 50 && !refreshing) handleRefresh();
      else setPullDistance(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshing, handleRefresh]);

  const official = items.filter((a) => a.is_official);
  const community = items.filter((a) => !a.is_official);

  return (
    <div ref={containerRef} className="page-container py-6 sm:py-8 space-y-8">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center" style={{ transform: `translateY(${pullDistance}px)`, transition: "transform 0.1s" }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className={`h-4 w-4 ${pullDistance > 50 ? "" : "animate-spin"}`} />
            {pullDistance > 50 ? t("Release to refresh", lang) : t("Pull to refresh", lang)}
          </div>
        </div>
      )}
      {refreshing && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Refreshing…", lang)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="section-title">{t("Announcements", lang)}</h1>
          <p className="section-subtitle">
            {t("Official advisories and community announcements about the water situation in SJDM.", lang)}
          </p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-water-muted flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-water" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("Official Announcements", lang)}</h2>
            <p className="text-xs text-muted-foreground">{official.length} announcement{official.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {official.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">{t("No official announcements yet.", lang)}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {official.map((a) => (
              <AnnounceCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <Megaphone className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("Community Announcements", lang)}</h2>
            <p className="text-xs text-muted-foreground">{community.length} announcement{community.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {community.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">{t("No community announcements yet.", lang)}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {community.map((a) => (
              <AnnounceCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        )}
      </section>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Loading…", lang)}
          </div>
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pb-4">{t("All announcements loaded", lang)}</p>
      )}
    </div>
  );
}
