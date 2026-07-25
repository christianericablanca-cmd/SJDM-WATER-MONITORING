export default function AnnouncementsLoading() {
  const SkeletonCard = () => (
    <div className="rounded-xl border shadow-card overflow-hidden flex flex-col sm:flex-row animate-pulse">
      <div className="w-full sm:w-[360px] lg:w-[440px] shrink-0 bg-muted" style={{ minHeight: 280 }} />
      <div className="flex-1 p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted/60 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/3 bg-muted/60 rounded" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3 w-full bg-muted/60 rounded" />
          <div className="h-3 w-5/6 bg-muted/60 rounded" />
          <div className="h-3 w-4/6 bg-muted/60 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      <div className="space-y-1">
        <div className="h-7 sm:h-9 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
            <div className="h-5 w-44 bg-muted rounded animate-pulse" />
            <div className="h-4 w-6 bg-muted/60 rounded animate-pulse" />
          </div>
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, j) => <SkeletonCard key={j} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
