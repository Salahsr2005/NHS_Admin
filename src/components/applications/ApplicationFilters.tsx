import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Search, Calendar, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApplicationFiltersState {
  search: string;
  jobId: string | null;
  gender: string | null;
  wilaya: string | null;
  minRating: number;
  maxAge: number | null;
  minAge: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface ApplicationFiltersProps {
  filters: ApplicationFiltersState;
  onFiltersChange: (filters: ApplicationFiltersState) => void;
  jobs: { id: string; title: string }[];
  wilayas: string[];
}

export function ApplicationFilters({
  filters,
  onFiltersChange,
  jobs,
  wilayas,
}: ApplicationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.jobId,
    filters.gender,
    filters.wilaya,
    filters.minRating > 0,
    filters.minAge,
    filters.maxAge,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      jobId: null,
      gender: null,
      wilaya: null,
      minRating: 0,
      maxAge: null,
      minAge: null,
      dateFrom: null,
      dateTo: null,
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or job..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 bg-secondary/30 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "gap-2 border-border/50",
                activeFiltersCount > 0 && "border-primary/50 bg-primary/5"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Advanced Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Job Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Job Position</Label>
                <Select
                  value={filters.jobId || 'all'}
                  onValueChange={(v) => onFiltersChange({ ...filters, jobId: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="bg-secondary/30">
                    <SelectValue placeholder="All jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <Select
                  value={filters.gender || 'all'}
                  onValueChange={(v) => onFiltersChange({ ...filters, gender: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="bg-secondary/30">
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Wilaya Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Wilaya</Label>
                <Select
                  value={filters.wilaya || 'all'}
                  onValueChange={(v) => onFiltersChange({ ...filters, wilaya: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="bg-secondary/30">
                    <SelectValue placeholder="All wilayas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All wilayas</SelectItem>
                    {wilayas.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Minimum Rating</Label>
                  <span className="text-xs font-medium text-foreground">
                    {filters.minRating > 0 ? `${filters.minRating}+ stars` : 'Any'}
                  </span>
                </div>
                <Slider
                  value={[filters.minRating]}
                  onValueChange={([v]) => onFiltersChange({ ...filters, minRating: v })}
                  min={0}
                  max={5}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Min Age</Label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={filters.minAge || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      minAge: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Age</Label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={filters.maxAge || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      maxAge: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="bg-secondary/30"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
                    className="bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To Date</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
                    className="bg-secondary/30"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
