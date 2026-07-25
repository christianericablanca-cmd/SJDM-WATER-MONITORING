export default function MapLoading() {
  return (
    <div className="page-container py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="h-7 sm:h-9 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="h-6 w-28 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-[55vh] min-h-[350px] sm:h-[600px] xl:h-[700px] rounded-xl bg-muted animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border shadow-card p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted animate-pulse shrink-0" />
            <div className="space-y-1">
              <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-xl border shadow-card p-4 sm:p-5 space-y-4">
          <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-muted/60 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border shadow-card p-4 sm:p-5 space-y-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
              <div className="h-3 flex-1 bg-muted/60 rounded animate-pulse" />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                ))}
              </div>
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
