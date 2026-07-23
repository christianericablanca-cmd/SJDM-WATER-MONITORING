import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import { createServerSupabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { Phone, MapPin, CheckCircle2, Clock, PlusCircle, Droplets, Truck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Business } from "@/lib/types";
import Link from "next/link";
import { BusinessCard } from "@/components/directory/business-card";

export const revalidate = 300;

const CAT_ICONS: Record<string, typeof Droplets> = {
  water_refilling: Droplets,
  mineral_water_delivery: Truck,
  water_tanker: Truck,
  laundry_services: WashingMachine,
};

const CAT_COLORS: Record<string, string> = {
  water_refilling: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  mineral_water_delivery: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  water_tanker: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
  laundry_services: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
};

export default async function DirectoryPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "en") as "en" | "tl";

  const supabase = await createServerSupabase();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("disabled", false)
    .order("verified", { ascending: false })
    .order("name");

  const grouped: Record<string, Business[]> = {};
  businesses?.forEach((b) => {
    const arr = grouped[b.category];
    if (arr) { arr.push(b); }
    else { grouped[b.category] = [b]; }
  });

  return (
    <div className="page-container py-4 sm:py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="section-title">{t("Services", lang)}</h1>
          <p className="section-subtitle">
            {t("Find alternatives during water interruptions — refilling stations, delivery services, laundry, and more.", lang)}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/directory/claim">
            <PlusCircle className="h-4 w-4 mr-2" /> {t("Add Your Business", lang)}
          </Link>
        </Button>
      </div>

      {BUSINESS_CATEGORIES.map((cat) => {
        const items = grouped[cat.value] || [];
        const Icon = CAT_ICONS[cat.value] || Droplets;
        const colorCls = CAT_COLORS[cat.value] || "";

        return (
          <section key={cat.value}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorCls)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-semibold">{t(cat.label, lang)}</h3>
              {cat.value === "water_tanker" && (
                <span className="text-[9px] text-muted-foreground">{t("PRIVATE PAID SERVICE — Not affiliated with the LGU", lang)}</span>
              )}
              <Badge variant="secondary" className="ml-auto text-[9px] px-1.5">{items.length}</Badge>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed">
                <p className="text-xs text-muted-foreground">{t("No listings in this category yet.", lang)}</p>
                <Button variant="link" size="sm" asChild className="mt-0.5 text-xs">
                  <Link href="/directory/claim">{t("Be the first to add one", lang)}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-1.5">
                {items.map((biz) => (
                  <BusinessCard key={biz.id} biz={biz} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

