import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, RecentApplication } from '@/types/database';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, trend, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          )}
          {trend && !loading && (
            <p className="mt-1 text-xs text-success">{trend}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      return data?.[0] as DashboardStats | null;
    },
  });

  const { data: recentApplications, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_applications', { limit_count: 5 });
      if (error) throw error;
      return data as RecentApplication[];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      reviewing: 'bg-primary/10 text-primary border-primary/20',
      shortlisted: 'bg-success/10 text-success border-success/20',
      accepted: 'bg-success/10 text-success border-success/20',
      rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return variants[status] || 'bg-secondary text-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your recruitment pipeline
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={stats?.total_jobs ?? 0}
          icon={<Briefcase className="h-5 w-5 text-muted-foreground" />}
          loading={statsLoading}
        />
        <StatCard
          title="Open Positions"
          value={stats?.open_jobs ?? 0}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          loading={statsLoading}
        />
        <StatCard
          title="Total Applications"
          value={stats?.total_applications ?? 0}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          loading={statsLoading}
        />
        <StatCard
          title="Total Candidates"
          value={stats?.total_applicants ?? 0}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          loading={statsLoading}
        />
      </div>

      {/* Application Status Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-lg font-semibold text-foreground">{stats?.pending_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reviewing</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-lg font-semibold text-foreground">{stats?.reviewing_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shortlisted</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-lg font-semibold text-foreground">{stats?.shortlisted_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accepted</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-lg font-semibold text-foreground">{stats?.accepted_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-5 w-8" />
              ) : (
                <p className="text-lg font-semibold text-foreground">{stats?.rejected_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Today</p>
          {statsLoading ? (
            <Skeleton className="mt-2 h-6 w-12" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.applications_today ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">applications</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">This Week</p>
          {statsLoading ? (
            <Skeleton className="mt-2 h-6 w-12" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.applications_this_week ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">applications</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">This Month</p>
          {statsLoading ? (
            <Skeleton className="mt-2 h-6 w-12" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats?.applications_this_month ?? 0}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">applications</p>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Recent Applications</h2>
        </div>
        <div className="divide-y divide-border">
          {recentLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            ))
          ) : recentApplications && recentApplications.length > 0 ? (
            recentApplications.map((app) => (
              <div key={app.application_id} className="flex items-center gap-4 px-6 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={app.applicant_avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-sm font-medium text-foreground">
                    {app.applicant_name?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {app.applicant_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Applied for {app.job_title || 'Unknown Position'}
                  </p>
                </div>
                <Badge className={`${getStatusBadge(app.status)} border capitalize`}>
                  {app.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No applications yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
