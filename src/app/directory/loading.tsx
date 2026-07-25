export default function DirectoryLoading() {
  return (
    <div className="page-container py-4 sm:py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="h-7 sm:h-9 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-56 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-muted rounded-lg animate-pulse" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
            <div className="h-4 w-6 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-1.5">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="rounded-xl border shadow-card p-3 space-y-2">
                <div className="w-full aspect-square bg-muted rounded-lg animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-2 w-3/4 bg-muted/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
