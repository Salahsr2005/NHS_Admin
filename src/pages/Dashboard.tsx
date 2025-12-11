import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats, RecentApplication } from '@/types/database';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ApplicationsChart } from '@/components/dashboard/ApplicationsChart';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { useUserRole } from '@/hooks/useUserRole';

export default function Dashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();

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

  // Generate chart data from stats
  const chartData = [
    { date: 'Today', count: stats?.applications_today ?? 0 },
    { date: 'This Week', count: stats?.applications_this_week ?? 0 },
    { date: 'This Month', count: stats?.applications_this_month ?? 0 },
  ];

  const statusData = [
    { name: 'Pending', value: stats?.pending_applications ?? 0, color: 'hsl(45, 93%, 47%)' },
    { name: 'Reviewing', value: stats?.reviewing_applications ?? 0, color: 'hsl(221, 83%, 53%)' },
    { name: 'Shortlisted', value: stats?.shortlisted_applications ?? 0, color: 'hsl(142, 71%, 45%)' },
    { name: 'Accepted', value: stats?.accepted_applications ?? 0, color: 'hsl(160, 84%, 39%)' },
    { name: 'Rejected', value: stats?.rejected_applications ?? 0, color: 'hsl(0, 84%, 60%)' },
  ];

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
      {/* Header with Admin Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your recruitment pipeline
          </p>
        </div>
        {!roleLoading && isAdmin && (
          <CreateUserDialog />
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={stats?.total_jobs ?? 0}
          icon={<Briefcase className="h-6 w-6 text-primary" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Open Positions"
          value={stats?.open_jobs ?? 0}
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
          trend={stats?.open_jobs ? `${Math.round((stats.open_jobs / (stats.total_jobs || 1)) * 100)}% of total` : undefined}
          trendUp
          loading={statsLoading}
        />
        <StatsCard
          title="Total Applications"
          value={stats?.total_applications ?? 0}
          icon={<FileText className="h-6 w-6 text-primary" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Candidates"
          value={stats?.total_applicants ?? 0}
          icon={<Users className="h-6 w-6 text-primary" />}
          loading={statsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Applications Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Applications Overview</h2>
          <ApplicationsChart data={chartData} loading={statsLoading} />
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Status Distribution</h2>
          <StatusPieChart data={statusData} loading={statsLoading} />
        </div>
      </div>

      {/* Application Status Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-warning/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-bold text-foreground">{stats?.pending_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reviewing</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-bold text-foreground">{stats?.reviewing_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-success/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Shortlisted</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-bold text-foreground">{stats?.shortlisted_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-success/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Accepted</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-bold text-foreground">{stats?.accepted_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
              {statsLoading ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-bold text-foreground">{stats?.rejected_applications ?? 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
          {statsLoading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-3 text-3xl font-bold text-foreground">{stats?.applications_today ?? 0}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">new applications</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-success/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Week</p>
          {statsLoading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-3 text-3xl font-bold text-foreground">{stats?.applications_this_week ?? 0}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">applications received</p>
        </div>
        <div className="rounded-xl border border-border bg-gradient-to-br from-card to-warning/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month</p>
          {statsLoading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-3 text-3xl font-bold text-foreground">{stats?.applications_this_month ?? 0}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">total applications</p>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Applications</h2>
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
              <div key={app.application_id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/50">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={app.applicant_avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {app.applicant_name?.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {app.applicant_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Applied for <span className="font-medium">{app.job_title || 'Unknown Position'}</span>
                  </p>
                </div>
                <Badge className={`${getStatusBadge(app.status)} border capitalize`}>
                  {app.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No applications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
