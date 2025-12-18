import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { ApplicantCard } from '@/components/applicants/ApplicantCard';
import { Users, Search, LayoutGrid, List, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApplicantWithStats {
  id: string;
  first_name: string;
  last_name: string;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['applicants', search, genderFilter, wilayaFilter],
    queryFn: async () => {
      let query = supabase
        .from('applicants')
        .select('id, first_name, last_name, email, phone, gender, wilaya, age, avatar_url, rating, skills, applications(count)')
        .order('created_at', { ascending: false });

      const term = search.trim();
      if (term) {
        query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
      }

      if (genderFilter !== 'all') query = query.eq('gender', genderFilter);
      if (wilayaFilter !== 'all') query = query.eq('wilaya', wilayaFilter);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row,
        total_applications: row.applications?.[0]?.count ?? 0,
      })) as ApplicantWithStats[];
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

  // Get CV URL for applicant
  const getCVUrl = (applicantId: string) => {
    // This will be fetched per card if needed
    return null;
  };

  const updateRatingMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase
        .from('applicants')
        .update({ rating })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
      toast.success('Rating updated successfully');
    },
    onError: () => {
      toast.error('Failed to update rating');
    },
  });

  const allWilayas = [...new Set(allApplicants?.map((a) => a.wilaya).filter(Boolean) || [])];
  const hasActiveFilters = search || genderFilter !== 'all' || wilayaFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setGenderFilter('all');
    setWilayaFilter('all');
  };

  const handleRatingChange = (id: string, rating: number) => {
    updateRatingMutation.mutate({ id, rating });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applicants?.length || 0} candidates in your talent pool
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-9 w-9"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full sm:w-36 bg-background">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-background">
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
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
            {search && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setSearch('')}
              >
                Search: {search}
                <X className="h-3 w-3" />
              </Button>
            )}
            {genderFilter !== 'all' && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs gap-1 capitalize"
                onClick={() => setGenderFilter('all')}
              >
                {genderFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            {wilayaFilter !== 'all' && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setWilayaFilter('all')}
              >
                {wilayaFilter}
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(
          "gap-4",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "flex flex-col"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "rounded-xl border border-border bg-card animate-pulse",
                viewMode === 'grid' ? "h-80" : "h-24"
              )} 
            />
          ))}
        </div>
      ) : !applicants || applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description={hasActiveFilters
            ? "Try adjusting your filters to see more results."
            : "No candidates have applied yet."}
        />
      ) : (
        <div className={cn(
          "gap-4",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "flex flex-col"
        )}>
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onSelect={() => {
                // This now does nothing - the card handles navigation internally
              }}
              onRatingChange={(rating) => handleRatingChange(applicant.id, rating)}
            />
          ))}
        </div>
      )}
    </div>
  );
}