export default function HowToUseLoading() {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-72 bg-muted rounded animate-pulse" />
          <div className="h-3 w-48 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-56 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-muted/60 rounded animate-pulse" />
        </div>
      ))}
      <div className="rounded-xl bg-water/10 p-4 space-y-2">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
  );
}
