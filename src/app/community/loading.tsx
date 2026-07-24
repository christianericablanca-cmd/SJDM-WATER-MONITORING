import { Loader2 } from "lucide-react";

export default function CommunityLoading() {
  return (
    <div className="page-container py-4 sm:py-8 space-y-4">
      <div className="space-y-1">
        <div className="h-7 sm:h-9 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <div className="border-b h-11 px-3 flex items-center">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-3 space-y-3 min-h-[300px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0 animate-pulse" />
              <div className="space-y-1.5 max-w-[70%]">
                <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                <div className={cn("rounded-[18px] p-3", i % 2 === 0 ? "rounded-bl-[6px] bg-muted" : "bg-water/20")}>
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted/60 rounded mt-2 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-3 py-2.5">
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
