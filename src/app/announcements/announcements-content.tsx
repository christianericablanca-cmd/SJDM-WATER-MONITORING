"use client";

import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Building2, ImageOff } from "lucide-react";
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
}

function AnnounceCard({ a, lang }: { a: Announcement; lang: "en" | "tl" }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="shadow-card border-border/60 overflow-hidden flex flex-col">
      {a.image_url && !imgError ? (
        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
          <img
            src={a.image_url}
            alt={a.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : a.image_url && imgError ? (
        <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        </div>
      ) : null}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant={a.is_official ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {a.is_official ? t("Official", lang) : t("Community", lang)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
        </div>
        <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
        {a.is_official && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("Source:", lang)} {a.source}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{a.content}</p>
      </CardContent>
    </Card>
  );
}

export function AnnouncementsContent({ announcements }: AnnouncementsContentProps) {
  const { lang } = useLanguage();

  const official = announcements?.filter((a) => a.is_official) ?? [];
  const community = announcements?.filter((a) => !a.is_official) ?? [];

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="section-title">{t("Announcements", lang)}</h1>
        <p className="section-subtitle">
          {t("Official advisories and community announcements about the water situation in SJDM.", lang)}
        </p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-4">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {official.map((a) => (
              <AnnounceCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {community.map((a) => (
              <AnnounceCard key={a.id} a={a} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
