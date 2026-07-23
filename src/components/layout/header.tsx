"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Droplets, Sun, Moon, Languages, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";
import { BugReportDialog } from "@/components/ui/bug-report-button";

const NAV_ITEMS = [
  { label: "Water Map", href: "/map" },
  { label: "Submit Report", href: "/report" },
  { label: "Services", href: "/directory" },
  { label: "Emergency", href: "/emergency" },
  { label: "Announcements", href: "/announcements" },
];

export function Header() {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const [showBugReport, setShowBugReport] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b safe-top">
      <div className="page-container">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group min-h-[44px]">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-water text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Droplets className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm sm:text-base tracking-tight">WaterWatch</span>
              <span className="text-[10px] sm:text-[11px] font-medium text-water -mt-0.5">SJDM</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2.5 lg:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] flex items-center",
                    active
                      ? "bg-water-muted text-water-dark dark:text-water"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {t(item.label, lang)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowBugReport(true)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Report a problem"
              title="Report a problem"
            >
              <Bug className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "tl" : "en")}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors relative"
              aria-label="Toggle language"
              title={lang === "en" ? "Tagalog" : "English"}
            >
              <Languages className="h-4.5 w-4.5" />
              <span className="absolute text-[8px] font-bold bottom-0.5 right-0.5 leading-none">
                {lang === "en" ? "EN" : "TL"}
              </span>
            </button>
            <button
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {resolved === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>
            <Button variant="default" size="sm" className="hidden md:inline-flex shadow-sm h-9 min-h-[44px]" asChild>
              <Link href="/report">
                <Droplets className="h-3.5 w-3.5 mr-1.5" />
                {t("Report Issue", lang)}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <BugReportDialog open={showBugReport} onClose={() => setShowBugReport(false)} />
    </header>
  );
}
