import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/* ── Admin Product Card Skeleton ── */
export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 sm:h-40 md:h-48 bg-muted/30">
        <Skeleton className="w-full h-full rounded-none" />
        <Skeleton className="absolute top-1 right-1 w-8 h-5 rounded-full" />
      </div>
      <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="space-y-0.5 sm:space-y-1">
          <Skeleton className="h-6 sm:h-8 w-24" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 pt-1 sm:pt-2 border-t">
          <Skeleton className="flex-1 h-7 sm:h-8 rounded-md" />
          <Skeleton className="h-7 sm:h-8 w-8 rounded-md" />
          <Skeleton className="h-7 sm:h-8 w-8 rounded-md" />
          <Skeleton className="h-7 sm:h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductCardSkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Storefront Product Card Skeleton ── */
export function StorefrontCardSkeleton() {
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border">
      <div className="relative h-48 sm:h-56 lg:h-64">
        <Skeleton className="w-full h-full rounded-none" />
      </div>
      <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-2/3" />
        <div className="flex justify-between items-center pt-3 sm:pt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card Skeleton (Dashboard) ── */
export function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-4 w-28" />
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Activity & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-6 w-36" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-10" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Skeleton ── */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <Skeleton className="h-10 w-24 rounded-md mb-4" />
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          {/* Info */}
          <div className="space-y-6">
            <Skeleton className="h-4 w-40" />
            <div>
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="w-5 h-5 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="border-t pt-4 space-y-2">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="border-t pt-6 space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1 rounded-md" />
                <Skeleton className="h-12 flex-1 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Category Section Skeleton ── */
export function CategorySectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <ProductCardSkeleton key={j} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Sales Table Skeleton ── */
export function SalesTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-border/50">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
