import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-20 rounded mb-2" />
        <Skeleton className="h-3 w-36 rounded" />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({ className, height = 224 }: { className?: string; height?: number }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-3 w-32 rounded mt-1" />
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg bg-muted/40" style={{ height }}>
          {/* Animated shimmer bar chart illusion */}
          <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4">
            {[65, 80, 55, 90, 70, 85, 60, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-muted animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
          {/* Baseline */}
          <div className="absolute bottom-4 left-4 right-4 h-px bg-border" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-40 rounded" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 px-5 py-3">
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton
                  key={c}
                  className={cn('h-3 rounded', c === 0 ? 'w-32' : c === cols - 1 ? 'w-16' : 'flex-1')}
                  style={{ animationDelay: `${(r * cols + c) * 40}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
