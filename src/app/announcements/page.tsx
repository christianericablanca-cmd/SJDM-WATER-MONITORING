import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Megaphone, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const supabase = await createServerSupabase();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  const official = announcements?.filter((a) => a.is_official) ?? [];
  const community = announcements?.filter((a) => !a.is_official) ?? [];

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div>
        <h1 className="section-title">Announcements</h1>
        <p className="section-subtitle">
          Official advisories and community announcements about the water situation in SJDM.
        </p>
      </div>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-water-muted flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-water" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Official Announcements</h2>
            <p className="text-xs text-muted-foreground">{official.length} announcement{official.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {official.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">No official announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {official.map((a) => (
              <Card key={a.id} className="shadow-card border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Official</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                  </div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <CardDescription className="text-xs">Source: {a.source}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <Megaphone className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Community Announcements</h2>
            <p className="text-xs text-muted-foreground">{community.length} announcement{community.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {community.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">No community announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {community.map((a) => (
              <Card key={a.id} className="shadow-card border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Community</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                  </div>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
