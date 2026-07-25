export default function TermsLoading() {
  return (
    <div className="page-container py-8 sm:py-12 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted/60 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted/60 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
