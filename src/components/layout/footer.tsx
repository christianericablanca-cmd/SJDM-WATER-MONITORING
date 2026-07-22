"use client";

import Link from "next/link";
import { Droplets, Heart } from "lucide-react";

const NAV_LINKS = [
  { label: "Map", href: "/map" },
  { label: "Submit Report", href: "/report" },
  { label: "Services", href: "/directory" },
  { label: "Emergency", href: "/emergency" },
  { label: "Announcements", href: "/announcements" },
  { label: "How to Use", href: "#", action: "howto" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export function Footer() {
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
              <span key={link.label} className="flex items-center gap-4">
                {i > 0 && <span className="w-px h-3 bg-border hidden sm:block" />}
                {link.action === "howto" ? (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("ww-disclaim-accepted");
                      window.location.reload();
                    }}
                    className="hover:text-water transition-colors"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link href={link.href} className="hover:text-water transition-colors">
                    {link.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p className="text-center sm:text-left">
            Independent community platform. Not affiliated with PrimeWater, MPBW, or the LGU.
          </p>
          <div className="flex items-center gap-3 text-center sm:text-right">
            <span className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> by an SJDM programmer citizen
            </span>
            <span className="text-[10px] text-muted-foreground/50">&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
