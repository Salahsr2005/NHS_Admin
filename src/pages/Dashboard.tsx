import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Users, FileText, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';

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
  const { data: jobsCount, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: openJobsCount, isLoading: openJobsLoading } = useQuery({
    queryKey: ['open-jobs-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      return count || 0;
    },
  });

  const { data: applicationsCount, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: candidatesCount, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('applicants')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: recentApplications, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          applied_at,
          applicant:applicants(full_name, email),
          job:jobs(title)
        `)
        .order('applied_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your recruitment pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={jobsCount ?? 0}
          icon={<Briefcase className="h-5 w-5 text-muted-foreground" />}
          loading={jobsLoading}
        />
        <StatCard
          title="Open Positions"
          value={openJobsCount ?? 0}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          loading={openJobsLoading}
        />
        <StatCard
          title="Applications"
          value={applicationsCount ?? 0}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          loading={applicationsLoading}
        />
        <StatCard
          title="Candidates"
          value={candidatesCount ?? 0}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          loading={candidatesLoading}
        />
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
            recentApplications.map((app: any) => (
              <div key={app.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                  {app.applicant?.full_name?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {app.applicant?.full_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Applied for {app.job?.title || 'Unknown Position'}
                  </p>
                </div>
                <span className="rounded border border-border px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {app.status}
                </span>
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
