import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Clock, Eye, CheckCircle, XCircle, FileText, MapPin, ClipboardList } from 'lucide-react';
import { getRandomAvatar } from '@/components/applicants/ApplicantCard';
import { cn, getPersonDisplayName, getPersonInitials } from '@/lib/utils';
import { format } from 'date-fns';

interface ApplicationCardProps {
  application: {
    id: string;
    status: string;
    applied_at: string;
    cv_url: string | null;
    job: { id: string; title: string; location: string } | null;
    applicant: {
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
    } | null;
  };
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}

export function ApplicationCard({
  application,
  isSelected,
  onSelect,
  onView,
  onStatusChange,
  isUpdating,
}: ApplicationCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      reviewing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      shortlisted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      accepted: 'bg-green-500/10 text-green-600 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return styles[status] || 'bg-secondary text-foreground';
  };

  const parseSkills = (skills: any): string[] => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    try {
      return JSON.parse(skills);
    } catch {
      return [];
    }
  };

  const avatarUrl = application.applicant?.avatar_url || 
    getRandomAvatar(application.applicant?.gender || null, application.applicant?.id || '');
  const skills = parseSkills(application.applicant?.skills);

  const openCV = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (application.cv_url) {
      window.open(application.cv_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-card to-card/80 hover:from-card hover:to-secondary/20",
        "border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className={cn(
            "h-5 w-5 border-2 transition-all",
            isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background/80"
          )}
        />
      </div>

      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className={cn("border font-medium capitalize", getStatusStyles(application.status))}>
          {application.status}
        </Badge>
      </div>

      <CardContent className="p-5 pt-10">
        {/* Avatar and Name */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className={cn(
            "h-14 w-14 ring-2 ring-background shadow-lg transition-transform duration-300",
            isHovered && "scale-105"
          )}>
            <AvatarImage src={avatarUrl} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-lg font-bold">
              {getPersonInitials(application.applicant)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate">
              {getPersonDisplayName(application.applicant)}
            </h3>
            <p className="text-sm text-primary font-medium truncate mt-0.5">
              {application.job?.title || 'Unknown Position'}
            </p>
            
            {/* Rating */}
            {application.applicant?.rating && (
              <div className="flex items-center gap-0.5 mt-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < application.applicant!.rating! 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(application.applied_at), 'MMM d, yyyy')}
          </span>
          {application.applicant?.wilaya && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {application.applicant.wilaya}
            </span>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs bg-secondary/50">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-red-500/30 text-red-600 hover:bg-red-500/10"
            onClick={() => onStatusChange('rejected')}
            disabled={application.status === 'rejected' || isUpdating}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            onClick={() => onStatusChange('shortlisted')}
            disabled={application.status === 'shortlisted' || isUpdating}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Shortlist
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Quick View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary"
            onClick={() => navigate(`/applications/${application.id}`)}
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1" />
            Timeline
          </Button>
          {application.cv_url && (
            <Button
              variant="secondary"
              size="sm"
              className="text-xs bg-secondary hover:bg-secondary/80"
              onClick={openCV}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
