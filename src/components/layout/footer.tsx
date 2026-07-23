"use client";

import Link from "next/link";
import { Droplets, Heart } from "lucide-react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/ui/language-provider";

const NAV_LINKS = [
  { key: "Water Map", href: "/map" },
  { key: "Submit Report", href: "/report" },
  { key: "Services", href: "/directory" },
  { key: "Emergency", href: "/emergency" },
  { key: "Announcements", href: "/announcements" },
  { key: "How to Use", href: "#", action: "howto" },
  { key: "Privacy", href: "/privacy" },
  { key: "Terms", href: "/terms" },
  { key: "Disclaimer", href: "/disclaimer" },
];

export function Footer() {
  const { lang } = useLanguage();
  return (
    <footer className="border-t border-water/10 bg-gradient-to-b from-card to-muted/30 mt-16 safe-bottom">
      <div className="page-container py-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-water text-white group-hover:scale-105 transition-transform">
              <Droplets className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight">WaterWatch</span>
              <span className="text-[10px] font-medium text-water -mt-0.5">SJDM</span>
            </div>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {NAV_LINKS.map((link, i) => (
              <span key={link.key} className="flex items-center gap-4">
                {i > 0 && <span className="w-px h-3 bg-border hidden sm:block" />}
                {link.action === "howto" ? (
                  <Link href="/disclaimer" className="hover:text-water transition-colors">
                    {t(link.key, lang)}
                  </Link>
                ) : (
                  <Link href={link.href} className="hover:text-water transition-colors">
                    {t(link.key, lang)}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p className="text-center sm:text-left">
            {t("WaterWatch SJDM is an independent community platform.", lang)} {t("Not affiliated with water providers or the LGU.", lang)}
          </p>
          <div className="flex items-center gap-3 text-center sm:text-right">
            <span className="flex items-center gap-1">
              {t("Built with <3 by an SJDM programmer citizen", lang)} <Heart className="h-3 w-3 text-red-400 fill-red-400" /> {t("for San Jose del Monte, Bulacan", lang)}
            </span>
            <span className="text-[10px] text-muted-foreground/50">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
