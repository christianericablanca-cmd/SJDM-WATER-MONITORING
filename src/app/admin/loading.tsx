export default function AdminLoading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0">
      <aside className="hidden lg:flex w-56 shrink-0 border-r bg-background flex-col p-4 space-y-4">
        <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex-1" />
        <div className="space-y-2 pt-4 border-t">
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="h-9 w-full bg-muted rounded-lg animate-pulse" />
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border shadow-card p-4 space-y-2">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-7 w-12 bg-muted rounded animate-pulse" />
              <div className="h-2 w-full bg-muted/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border shadow-card p-5 space-y-3">
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border shadow-card p-5 space-y-3">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
            <div className="h-48 w-full bg-muted/60 rounded animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
