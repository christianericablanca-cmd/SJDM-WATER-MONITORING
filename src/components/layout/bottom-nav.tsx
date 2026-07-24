"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Store, Droplets, Phone, Megaphone, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/ui/language-provider";
import { t } from "@/lib/i18n";

const NAV_ITEMS = [
  { key: "map", label: "Water Map", href: "/map", icon: MapPin },
  { key: "directory", label: "Services", href: "/directory", icon: Store },
  { key: "report", label: "Report", href: "/report", icon: Droplets },
  { key: "community", label: "Community", href: "/community", icon: MessageSquareText },
  { key: "emergency", label: "Emergency", href: "/emergency", icon: Phone },
  { key: "announcements", label: "Announcements", href: "/announcements", icon: Megaphone },
];

export function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t safe-bottom">
      <div className="grid grid-cols-6 h-14">
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
                "flex flex-col items-center justify-center gap-0 relative transition-colors",
                active ? "text-water" : "text-muted-foreground",
                isPrimary && "-mt-3",
              )}
            >
              {isPrimary ? (
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-water text-white shadow-md -mb-0.5">
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon className={cn("h-[18px] w-[18px]", active && "drop-shadow-sm")} />
              )}
              <span
                className={cn(
                  "text-[9px] leading-none",
                  isPrimary && "text-[8px] mt-0.5",
                  active && "text-water font-semibold",
                  !active && !isPrimary && "text-muted-foreground",
                )}
              >
                {isPrimary ? "" : t(item.label, lang).replace("Submit ", "")}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
