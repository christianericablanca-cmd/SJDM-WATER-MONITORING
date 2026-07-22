"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Water Map", href: "/map" },
  { label: "Submit Report", href: "/report" },
  { label: "Services", href: "/directory" },
  { label: "Emergency", href: "/emergency" },
  { label: "Announcements", href: "/announcements" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="hidden sm:inline-flex shadow-sm h-9 min-h-[44px] sm:min-h-[36px]" asChild>
              <Link href="/report">
                <Droplets className="h-3.5 w-3.5 mr-1.5" />
                Report Issue
              </Link>
            </Button>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary transition-colors"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="page-container py-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px]",
                    active
                      ? "bg-water-muted text-water-dark dark:text-water"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 pb-4">
              <Button variant="default" size="lg" className="w-full min-h-[48px] text-sm" asChild>
                <Link href="/report" onClick={() => setOpen(false)}>
                  <Droplets className="h-4 w-4 mr-2" />
                  Report Issue
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
