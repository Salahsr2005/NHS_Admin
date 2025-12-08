import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { Users, Search, Star, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicantWithStats {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  wilaya: string | null;
  age: number | null;
  avatar_url: string | null;
  rating: number | null;
  skills: any;
  total_applications: number;
}

export default function Applicants() {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['applicants', search, genderFilter, wilayaFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_applicants_filtered', {
        search_term: search || null,
        filter_gender: genderFilter === 'all' ? null : genderFilter,
        filter_wilaya: wilayaFilter === 'all' ? null : wilayaFilter,
        min_age: null,
        max_age: null,
        min_rating: null,
      });
      if (error) throw error;
      return data as ApplicantWithStats[];
    },
  });

  const { data: allApplicants } = useQuery({
    queryKey: ['all-applicants-for-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('wilaya, gender');
      if (error) throw error;
      return data;
    },
  });

  const { data: applicantDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['applicant-details', selectedApplicant?.id],
    queryFn: async () => {
      if (!selectedApplicant?.id) return null;
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', selectedApplicant.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedApplicant?.id,
  });

  const allWilayas = [...new Set(allApplicants?.map((a) => a.wilaya).filter(Boolean) || [])];

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
    if (!rating) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Candidates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and filter all candidates who have applied
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Wilaya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wilayas</SelectItem>
            {allWilayas.map((wilaya) => (
              <SelectItem key={wilaya} value={wilaya!}>
                {wilaya}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} columns={6} />
          </div>
        ) : !applicants || applicants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates found"
            description={search || genderFilter !== 'all' || wilayaFilter !== 'all'
              ? "Try adjusting your filters."
              : "No candidates have applied yet."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Demographics</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow 
                    key={applicant.id} 
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={applicant.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-xs font-medium">
                            {applicant.full_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{applicant.full_name}</p>
                          <p className="text-xs text-muted-foreground">{applicant.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {applicant.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {applicant.gender && (
                          <Badge variant="outline" className="w-fit text-xs capitalize">
                            {applicant.gender}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {applicant.age ? `${applicant.age} yrs` : '—'} • {applicant.wilaya || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {parseSkills(applicant.skills).slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {parseSkills(applicant.skills).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{parseSkills(applicant.skills).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderRating(applicant.rating)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{applicant.total_applications}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Applicant Detail Modal */}
      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          ) : applicantDetails && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={applicantDetails.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-xl font-medium">
                    {applicantDetails.full_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{applicantDetails.full_name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {applicantDetails.gender && (
                      <Badge variant="outline" className="capitalize">{applicantDetails.gender}</Badge>
                    )}
                    {applicantDetails.age && (
                      <Badge variant="outline">{applicantDetails.age} years old</Badge>
                    )}
                    {applicantDetails.rating && (
                      <div className="flex items-center gap-1">
                        {renderRating(applicantDetails.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{applicantDetails.email}</span>
                </div>
                {applicantDetails.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{applicantDetails.phone}</span>
                  </div>
                )}
                {applicantDetails.wilaya && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{applicantDetails.wilaya}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(applicantDetails.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Skills */}
              {parseSkills(applicantDetails.skills).length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(applicantDetails.skills).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {applicantDetails.education && Array.isArray(applicantDetails.education) && applicantDetails.education.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </h4>
                  <div className="space-y-2">
                    {applicantDetails.education.map((edu: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {applicantDetails.experience && Array.isArray(applicantDetails.experience) && applicantDetails.experience.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience
                  </h4>
                  <div className="space-y-2">
                    {applicantDetails.experience.map((exp: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
