export default function DisclaimerLoading() {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/10 p-4 space-y-2">
        <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-60 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
