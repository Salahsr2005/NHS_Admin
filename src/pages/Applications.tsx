import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusTabs: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
];

export default function Applications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(id, title),
          applicant:applicants(id, full_name, email)
        `)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: 'Status Updated',
        description: `Application marked as ${status}.`,
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredApplications = applications?.filter((app) =>
    activeTab === 'all' ? true : app.status === activeTab
  );

  const handleStatusUpdate = (id: string, status: ApplicationStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage job applications
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ApplicationStatus | 'all')}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
              {tab.label}
              {applications && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({tab.value === 'all'
                    ? applications.length
                    : applications.filter((a) => a.status === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : !filteredApplications || filteredApplications.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications found"
              description={activeTab === 'all' 
                ? "No applications have been submitted yet."
                : `No ${activeTab} applications.`}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {app.applicant?.full_name || 'Unknown'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {app.job?.title || 'Unknown Position'}
                      </p>
                    </div>
                    <Badge variant={app.status as ApplicationStatus} className="ml-2 shrink-0">
                      {app.status}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      disabled={app.status === 'rejected' || updateStatusMutation.isPending}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-success/30 text-success hover:bg-success/10"
                      onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                      disabled={app.status === 'shortlisted' || updateStatusMutation.isPending}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      Shortlist
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-muted-foreground"
                    onClick={() => setSelectedApplication(app)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Application Detail Modal */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Applicant</p>
                  <p className="text-sm text-foreground">{selectedApplication.applicant?.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{selectedApplication.applicant?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Position</p>
                  <p className="text-sm text-foreground">{selectedApplication.job?.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedApplication.status} className="mt-1">
                    {selectedApplication.status}
                  </Badge>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Cover Letter</p>
                  <div className="rounded-lg border border-border bg-secondary/50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                </div>
              )}

              {selectedApplication.cv_url && (
                <Button asChild variant="outline" className="w-full">
                  <a href={selectedApplication.cv_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download CV
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
