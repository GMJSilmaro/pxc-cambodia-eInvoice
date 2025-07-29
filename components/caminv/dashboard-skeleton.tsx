import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedSkeleton, StatCardSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/enhanced-skeleton';

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MerchantStatusSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecentInvoicesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-[60px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActionableInsightsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-5 w-[50px]" />
                </div>
                <Skeleton className="h-3 w-[250px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
