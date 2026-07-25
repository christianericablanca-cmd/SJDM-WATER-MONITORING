export default function TrackReportLoading() {
  return (
    <div className="page-container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="h-7 sm:h-9 w-40 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-5 w-48 bg-muted/60 rounded animate-pulse mx-auto" />
        </div>
        <div className="rounded-xl border shadow-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-36 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-12 w-full bg-muted/60 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-28 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border shadow-card p-5 space-y-4">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
                  {i < 4 && <div className="w-0.5 flex-1 bg-muted/60 rounded animate-pulse" />}
                </div>
                <div className="space-y-1 pb-4">
                  <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-44 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
