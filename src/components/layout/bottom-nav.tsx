"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Store, Droplets, Phone, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

const NAV_ITEMS = [
  { key: "map", label: "Water Map", href: "/map", icon: MapPin },
  { key: "directory", label: "Services", href: "/directory", icon: Store },
  { key: "report", label: "Submit Report", href: "/report", icon: Droplets },
  { key: "emergency", label: "Emergency", href: "/emergency", icon: Phone },
  { key: "announcements", label: "Announcements", href: "/announcements", icon: Megaphone },
];

export function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const isPrimary = item.key === "report";
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                active ? "text-water" : "text-muted-foreground",
                isPrimary && "-mt-6",
              )}
            >
              {isPrimary ? (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-water text-white shadow-lg -mt-1">
                  <Icon className="h-5.5 w-5.5" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isPrimary && "text-[9px] mt-1",
                  active && "text-water font-semibold",
                  !active && !isPrimary && "text-muted-foreground",
                )}
              >
                {t(item.label, lang)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
