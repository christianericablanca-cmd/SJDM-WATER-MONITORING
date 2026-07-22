import { Droplets, MapIcon, Phone, ClipboardList, Building2, Megaphone, ArrowRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: MapIcon,
    title: "Water Situation Map",
    desc: "Real-time community reports of water issues across SJDM barangays on an interactive map.",
    href: "/map",
    color: "text-water",
    bg: "bg-water-muted",
  },
  {
    icon: ClipboardList,
    title: "Submit a Report",
    desc: "Report water supply problems in your area. No account required — completely anonymous.",
    href: "/report",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    icon: Building2,
    title: "Services",
    desc: "Water refilling stations, delivery services, laundry, and private tankers.",
    href: "/directory",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    icon: Phone,
    title: "Emergency Contacts",
    desc: "Water provider hotlines, government offices, and emergency services.",
    href: "/emergency",
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/20",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Official advisories and community announcements about the water situation.",
    href: "/announcements",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const { count: activeReports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .neq("status", "resolved")
    .neq("status", "denied");

  const { count: businessCount } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true });

  const { count: emergencyCount } = await supabase
    .from("emergency_contacts")
    .select("*", { count: "exact", head: true });

  const { data: recentReports } = await supabase
    .from("reports")
    .select("barangay")
    .order("created_at", { ascending: false })
    .limit(200);

  const affectedBarangays = new Set(recentReports?.map((r) => r.barangay) ?? []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-water/5 via-transparent to-water-muted/30" />
        <div className="page-container relative py-12 sm:py-24 lg:py-28">
          <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-water-muted text-water-dark dark:text-water text-xs sm:text-sm font-medium">
              <BarChart3 className="h-3.5 w-3.5" />
              {activeReports ?? 0} active reports · {affectedBarangays.size} barangays
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              WaterWatch{" "}
              <span className="text-water">SJDM</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A community water monitoring platform helping San Jose del Monte residents report issues
              and find available resources during water interruptions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="w-full sm:w-auto shadow-md text-base h-12 px-8 min-h-[48px]" asChild>
                <Link href="/report">
                  <Droplets className="h-5 w-5 mr-2" />
                  Report an Issue
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8 min-h-[48px]" asChild>
                <Link href="/map">
                  <MapIcon className="h-5 w-5 mr-2" />
                  View Water Map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b bg-card/50">
        <div className="page-container py-5 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: "Active Reports", value: activeReports ?? 0, icon: ClipboardList },
              { label: "Affected Barangays", value: affectedBarangays.size, icon: MapIcon },
              { label: "Services", value: businessCount ?? 0, icon: Building2 },
              { label: "Emergency Contacts", value: emergencyCount ?? 0, icon: Phone },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-0.5">
                  <stat.icon className="h-3.5 w-3.5 text-water" />
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight">How WaterWatch Helps</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl mx-auto">
            Everything you need to stay informed and find help during water interruptions.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group block">
              <Card className="h-full transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 border-border/60">
                <CardHeader className="p-4 sm:p-6">
                  <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3", feature.bg)}>
                    <feature.icon className={cn("h-4.5 w-4.5 sm:h-5 sm:w-5", feature.color)} />
                  </div>
                  <CardTitle className="text-sm sm:text-base group-hover:text-water transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed mt-1">{feature.desc}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
                  <span className="inline-flex items-center text-sm font-medium text-water group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t bg-card/30">
        <div className="page-container py-8 sm:py-10">
          <div className="max-w-3xl mx-auto text-center space-y-2 px-2">
            <h3 className="font-semibold text-sm">Disclaimer</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              WaterWatch SJDM is an independent community reporting platform for San Jose del Monte, Bulacan.
              Information submitted by users represents community reports and does not constitute official statements
              from water providers or government agencies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
