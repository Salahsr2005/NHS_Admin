import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Applicant } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { Users, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Applicants() {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Applicant[];
    },
  });

  // Extract unique skills and wilayas for filters
  const allSkills = [...new Set(applicants?.flatMap((a) => a.skills || []) || [])];
  const allWilayas = [...new Set(applicants?.map((a) => a.wilaya).filter(Boolean) || [])];

  const filteredApplicants = applicants?.filter((applicant) => {
    const matchesSearch =
      applicant.full_name.toLowerCase().includes(search.toLowerCase()) ||
      applicant.email.toLowerCase().includes(search.toLowerCase());

    const matchesSkill =
      skillFilter === 'all' || (applicant.skills?.includes(skillFilter) ?? false);

    const matchesWilaya =
      wilayaFilter === 'all' || applicant.wilaya === wilayaFilter;

    return matchesSearch && matchesSkill && matchesWilaya;
  });

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
        <Select value={skillFilter} onValueChange={setSkillFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {allSkills.map((skill) => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by wilaya" />
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
            <TableSkeleton rows={8} columns={5} />
          </div>
        ) : !filteredApplicants || filteredApplicants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No candidates found"
            description={search || skillFilter !== 'all' || wilayaFilter !== 'all'
              ? "Try adjusting your filters."
              : "No candidates have applied yet."}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Wilaya</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{applicant.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {applicant.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {applicant.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {applicant.skills && applicant.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{applicant.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {applicant.wilaya || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(applicant.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
