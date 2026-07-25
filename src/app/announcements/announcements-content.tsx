"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Megaphone, Building2, ImageOff, Loader2, ChevronDown } from "lucide-react";
import { useState } from "react";

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
          <img
            src={a.image_url}
            alt={a.title}
            className="absolute inset-0 w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
          />
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

  const official = items.filter((a) => a.is_official);
  const community = items.filter((a) => !a.is_official);
  const loaded = items.length;
  const hasMore = loaded < total;

  const loadMore = async () => {
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
  };

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
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

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={loading} className="gap-2 min-w-[160px]">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : <><ChevronDown className="h-4 w-4" /> Load More ({total - loaded} left)</>}
          </Button>
        </div>
      )}
    </div>
  );
}
