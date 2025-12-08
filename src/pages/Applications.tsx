import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/Skeleton';
import { FileText, Download, CheckCircle, XCircle, Clock, Eye, Mail, Phone, MapPin, Star, Briefcase, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

const statusTabs: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
];

const statusOptions: ApplicationStatus[] = ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'];

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
          job:jobs(id, title, location),
          applicant:applicants(id, full_name, email, phone, gender, wilaya, age, avatar_url, rating, skills, education, experience)
        `)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data, error } = await supabase.rpc('update_application_status', {
        application_id_param: id,
        new_status: status,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-applications'] });
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

  const parseSkills = (skills: any): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') {
      try {
        return JSON.parse(skills);
      } catch {
        return [];
      }
    }
    return [];
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    );
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
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={app.applicant?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-sm font-medium">
                        {app.applicant?.full_name?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {app.applicant?.full_name || 'Unknown'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {app.job?.title || 'Unknown Position'}
                      </p>
                      {app.applicant?.rating && (
                        <div className="mt-1">
                          {renderRating(app.applicant.rating)}
                        </div>
                      )}
                    </div>
                    <Badge className={`${getStatusBadge(app.status)} border shrink-0 capitalize`}>
                      {app.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}</span>
                  </div>

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
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedApplication.applicant?.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-lg font-medium">
                    {selectedApplication.applicant?.full_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedApplication.applicant?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Applied for {selectedApplication.job?.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedApplication.applicant?.gender && (
                      <Badge variant="outline" className="capitalize">
                        {selectedApplication.applicant.gender}
                      </Badge>
                    )}
                    {selectedApplication.applicant?.age && (
                      <Badge variant="outline">{selectedApplication.applicant.age} yrs</Badge>
                    )}
                    {selectedApplication.applicant?.rating && (
                      <div className="flex items-center gap-1">
                        {renderRating(selectedApplication.applicant.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">Status:</span>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => handleStatusUpdate(selectedApplication.id, value as ApplicationStatus)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplication.applicant?.email}</span>
                </div>
                {selectedApplication.applicant?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.applicant.phone}</span>
                  </div>
                )}
                {selectedApplication.applicant?.wilaya && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedApplication.applicant.wilaya}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {parseSkills(selectedApplication.applicant?.skills).length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(selectedApplication.applicant?.skills).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedApplication.applicant?.education?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </h4>
                  <div className="space-y-2">
                    {selectedApplication.applicant.education.map((edu: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {selectedApplication.applicant?.experience?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience
                  </h4>
                  <div className="space-y-2">
                    {selectedApplication.applicant.experience.map((exp: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Cover Letter</h4>
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {selectedApplication.cover_letter}
                    </p>
                  </div>
                </div>
              )}

              {/* CV Download */}
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
