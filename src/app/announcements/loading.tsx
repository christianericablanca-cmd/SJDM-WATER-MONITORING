export default function AnnouncementsLoading() {
  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div className="space-y-1">
        <div className="h-7 sm:h-9 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
            <div className="h-5 w-44 bg-muted rounded animate-pulse" />
            <div className="h-4 w-6 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-xl border shadow-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                </div>
                <div className="h-5 w-64 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
