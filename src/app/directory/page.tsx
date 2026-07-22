import { cookies } from "next/headers";
import { t } from "@/lib/i18n";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { Phone, MapPin, Globe, CheckCircle2, Clock, PlusCircle, Droplets, Truck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Business } from "@/lib/types";
import Link from "next/link";

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
    .order("verified", { ascending: false })
    .order("name");

  const grouped: Record<string, Business[]> = {};
  businesses?.forEach((b) => {
    const arr = grouped[b.category];
    if (arr) { arr.push(b); }
    else { grouped[b.category] = [b]; }
  });

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
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
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorCls)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t(cat.label, lang)}</h2>
                {cat.value === "water_tanker" && (
                  <p className="text-[11px] text-muted-foreground">{t("PRIVATE PAID SERVICE — Not affiliated with the LGU", lang)}</p>
                )}
              </div>
              <Badge variant="secondary" className="ml-auto text-[10px]">{items.length}</Badge>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">{t("No listings in this category yet.", lang)}</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/directory/claim">{t("Be the first to add one", lang)}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((biz) => (
                  <Card key={biz.id} className="shadow-card border-border/60 hover:shadow-card-hover transition-all duration-200">
                    <CardHeader className="pb-3">
                      {biz.photo_url && (
                        <div className="w-full h-36 -mx-6 -mt-6 mb-3 rounded-t-xl overflow-hidden bg-muted">
                          <img src={biz.photo_url} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{biz.name}</CardTitle>
                        {biz.verified ? (
                          <Badge variant="success" className="shrink-0 text-[10px] px-1.5 py-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {t("Verified", lang)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">{t("Community", lang)}</Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {biz.address}, {biz.barangay}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                      {biz.contact && (
                        <a href={`tel:${biz.contact}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-water transition-colors">
                          <Phone className="h-3.5 w-3.5" /> {biz.contact}
                        </a>
                      )}
                      {biz.facebook && (
                        <a href={biz.facebook} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-water transition-colors">
                          <Globe className="h-3.5 w-3.5" /> {t("Facebook Page", lang)}
                        </a>
                      )}
                      {biz.operating_hours && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" /> {biz.operating_hours}
                        </div>
                      )}
                      {biz.delivery_available !== null && (
                        <div className="text-muted-foreground">
                          {t("Delivery:", lang)}{" "}{biz.delivery_available ? t("Available", lang) : t("Not available", lang)}
                        </div>
                      )}
                      {biz.estimated_fee && (
                        <div className="text-muted-foreground">{t("Fee:", lang)}{" "}{biz.estimated_fee}</div>
                      )}
                      {biz.latitude && biz.longitude && (
                        <a href={`https://www.google.com/maps?q=${biz.latitude},${biz.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-water text-xs font-medium hover:underline mt-1">
                          <MapPin className="h-3 w-3" /> {t("View on Map", lang)}
                        </a>
                      )}
                      {biz.last_verified && (
                        <p className="text-[11px] text-muted-foreground pt-1 border-t mt-2">
                          {t("Checked", lang)} {formatDate(biz.last_verified)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
