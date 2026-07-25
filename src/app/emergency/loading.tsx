export default function EmergencyLoading() {
  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div className="space-y-1">
        <div className="h-7 sm:h-9 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-xl border shadow-card p-4 space-y-2">
                <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                <div className="h-3 w-48 bg-muted/60 rounded animate-pulse" />
                <div className="flex gap-2 pt-1">
                  <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 space-y-1">
        <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
  );
}
