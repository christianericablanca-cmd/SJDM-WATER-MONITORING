export default function ClaimLoading() {
  return (
    <div className="page-container py-6 sm:py-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse mx-auto" />
        <div className="h-7 sm:h-9 w-52 bg-muted rounded animate-pulse mx-auto" />
        <div className="h-4 w-64 bg-muted/60 rounded animate-pulse mx-auto" />
      </div>
      <div className="max-w-xl mx-auto space-y-4 rounded-xl border shadow-card p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
          </div>
        ))}
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
