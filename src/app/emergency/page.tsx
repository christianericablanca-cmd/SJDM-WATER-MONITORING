import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Globe, MessageCircle, Building2, Shield, Siren } from "lucide-react";
import { EMERGENCY_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const CAT_ICONS: Record<string, typeof Phone> = {
  water_provider: Building2,
  government: Shield,
  emergency: Siren,
};

const CAT_COLORS: Record<string, string> = {
  water_provider: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
  government: "text-amber-500 bg-amber-50 dark:bg-amber-950/20",
  emergency: "text-red-500 bg-red-50 dark:bg-red-950/20",
};

export default async function EmergencyPage() {
  const supabase = await createServerSupabase();
  const { data: contacts } = await supabase
    .from("emergency_contacts")
    .select("*")
    .order("category")
    .order("name");

  const grouped: Record<string, typeof contacts> = {};
  contacts?.forEach((c) => {
    const arr = grouped[c.category];
    if (arr) { arr.push(c); }
    else { grouped[c.category] = [c]; }
  });

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="section-title">Emergency Contacts</h1>
        <p className="section-subtitle">
          Quick access to water provider hotlines, government offices, and emergency services in SJDM.
        </p>
      </div>

      {EMERGENCY_CATEGORIES.map((cat) => {
        const items = grouped[cat.value] || [];
        const Icon = CAT_ICONS[cat.value] || Phone;
        const colorCls = CAT_COLORS[cat.value] || "";

        return (
          <section key={cat.value}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorCls)}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-semibold">{cat.label}</h2>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">No contacts listed yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((contact) => (
                  <Card key={contact.id} className="shadow-card border-border/60 hover:shadow-card-hover transition-all duration-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{contact.name}</CardTitle>
                      {contact.address && (
                        <CardDescription className="text-sm">{contact.address}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {contact.phone && (
                          <Button size="sm" variant="outline" asChild className="text-xs h-8">
                            <a href={`tel:${contact.phone}`}>
                              <Phone className="h-3 w-3 mr-1" /> {contact.phone}
                            </a>
                          </Button>
                        )}
                        {contact.website && (
                          <Button size="sm" variant="outline" asChild className="text-xs h-8">
                            <a href={contact.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-3 w-3 mr-1" /> Website
                            </a>
                          </Button>
                        )}
                        {contact.messenger && (
                          <Button size="sm" variant="outline" asChild className="text-xs h-8">
                            <a href={contact.messenger} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3 w-3 mr-1" /> Messenger
                            </a>
                          </Button>
                        )}
                        {contact.latitude && contact.longitude && (
                          <Button size="sm" variant="outline" asChild className="text-xs h-8">
                            <a href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
                              target="_blank" rel="noopener noreferrer">
                              <MapPin className="h-3 w-3 mr-1" /> Location
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-200">
        <strong>For emergencies</strong> — Call 911 or contact the SJDM DRRMO and local authorities immediately.
        This directory is community-maintained and may not reflect real-time availability.
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
