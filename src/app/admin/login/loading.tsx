export default function AdminLoginLoading() {
  return (
    <div className="page-container py-16">
      <div className="max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-muted animate-pulse mx-auto" />
          <div className="h-6 w-36 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-3 w-52 bg-muted/60 rounded animate-pulse mx-auto" />
        </div>
        <div className="rounded-xl border shadow-card p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-10 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
