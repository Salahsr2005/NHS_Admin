import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Star, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, 
  FileText, ExternalLink, User, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRandomAvatar } from './ApplicantCard';

interface ApplicantDetailModalProps {
  applicant: any;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onRatingChange?: (rating: number) => void;
  cvUrl?: string | null;
}

export function ApplicantDetailModal({ 
  applicant, 
  open, 
  onClose, 
  isLoading = false,
  onRatingChange,
  cvUrl
}: ApplicantDetailModalProps) {
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

  const openCV = () => {
    if (cvUrl) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const avatarUrl = applicant?.avatar_url || (applicant ? getRandomAvatar(applicant.gender, applicant.id) : '');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-8 space-y-6">
            <div className="flex gap-6 items-center">
              <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-48 bg-muted animate-pulse rounded" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ) : applicant && (
          <>
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-br from-primary/10 via-secondary/50 to-background p-6 pb-8">
              <DialogHeader className="sr-only">
                <DialogTitle>Candidate Details</DialogTitle>
              </DialogHeader>
              
              <div className="flex items-start gap-5">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                  <AvatarImage src={avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold">
                    {applicant.full_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{applicant.full_name}</h2>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {applicant.gender && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize",
                          applicant.gender === 'female' 
                            ? "bg-pink-500/10 text-pink-600 border-pink-500/30" 
                            : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                        )}
                      >
                        <User className="h-3 w-3 mr-1" />
                        {applicant.gender}
                      </Badge>
                    )}
                    {applicant.age && (
                      <Badge variant="outline" className="bg-background/50">
                        {applicant.age} years old
                      </Badge>
                    )}
                  </div>

                  {/* Interactive Star Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => onRatingChange?.(i + 1)}
                          className="focus:outline-none transition-transform hover:scale-125"
                        >
                          <Star
                            className={cn(
                              "h-5 w-5 transition-colors",
                              i < (applicant.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30 hover:text-amber-400/50"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {applicant.rating ? `${applicant.rating}/5` : 'Not rated'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              {cvUrl && (
                <div className="flex gap-3">
                  <Button 
                    onClick={openCV}
                    className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View CV
                    <ExternalLink className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </div>
              )}

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{applicant.email}</p>
                  </div>
                </div>
                
                {applicant.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{applicant.phone}</p>
                    </div>
                  </div>
                )}
                
                {applicant.wilaya && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{applicant.wilaya}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">
                      {format(new Date(applicant.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {parseSkills(applicant.skills).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(applicant.skills).map((skill) => (
                      <Badge 
                        key={skill} 
                        className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {applicant.education && Array.isArray(applicant.education) && applicant.education.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Education
                  </h4>
                  <div className="space-y-2">
                    {applicant.education.map((edu: any, i: number) => (
                      <div 
                        key={i} 
                        className="rounded-xl border border-border/50 bg-gradient-to-r from-secondary/30 to-transparent p-4"
                      >
                        <p className="font-semibold text-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {applicant.experience && Array.isArray(applicant.experience) && applicant.experience.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Experience
                  </h4>
                  <div className="space-y-2">
                    {applicant.experience.map((exp: any, i: number) => (
                      <div 
                        key={i} 
                        className="rounded-xl border border-border/50 bg-gradient-to-r from-secondary/30 to-transparent p-4"
                      >
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
