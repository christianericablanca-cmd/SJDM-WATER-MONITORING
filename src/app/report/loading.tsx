export default function ReportLoading() {
  return (
    <div className="page-container py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="h-7 sm:h-9 w-44 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-muted/60 rounded animate-pulse mx-auto" />
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-1">
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="max-w-xl mx-auto space-y-4 rounded-xl border shadow-card p-6">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-64 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-muted rounded animate-pulse" />
            <div className="h-24 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-14 bg-muted rounded animate-pulse" />
            <div className="h-24 w-full bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="max-w-xl mx-auto rounded-xl border shadow-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-3 w-64 bg-muted/60 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-10 w-20 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
