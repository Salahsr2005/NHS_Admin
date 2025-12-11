import { ReactNode } from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon, trend, trendUp, loading, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{value}</p>
          )}
          {trend && !loading && (
            <p className={cn(
              "text-xs font-medium",
              trendUp ? "text-success" : "text-destructive"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
      </div>
    </div>
  );
}
