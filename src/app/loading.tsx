export default function HomeLoading() {
  return (
    <div>
      <div className="border-b bg-gradient-to-b from-water/5 to-transparent">
        <div className="page-container py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="h-6 w-48 bg-muted rounded-full animate-pulse mx-auto" />
            <div className="h-10 sm:h-12 w-72 sm:w-96 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-4 w-80 sm:w-[32rem] bg-muted/60 rounded animate-pulse mx-auto" />
            <div className="flex justify-center gap-3">
              <div className="h-11 w-40 bg-muted rounded-lg animate-pulse" />
              <div className="h-11 w-40 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-b bg-card/50">
        <div className="page-container py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="space-y-1">
                  <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="page-container py-12 sm:py-20 space-y-8 sm:space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="h-8 sm:h-10 w-56 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-4 w-72 bg-muted/60 rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border shadow-card p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="h-5 w-28 bg-muted rounded animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse" />
              </div>
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t bg-card/30">
        <div className="page-container py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="h-6 w-44 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-3 w-full bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-muted/60 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
