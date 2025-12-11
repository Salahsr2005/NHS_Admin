import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Mail, Phone, MapPin, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ApplicantCardProps {
  applicant: {
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
  };
  onSelect: () => void;
  onRatingChange?: (rating: number) => void;
  cvUrl?: string | null;
}

export function getRandomAvatar(gender: string | null, id: string): string {
  // Ensure id is a string
  const idStr = String(id || '');
  
  // Use the applicant ID to generate a consistent but random number 1-8
  const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const avatarNum = (hash % 8) + 1;
  const folder = gender === 'female' ? 'woman' : 'man';
  return `/avatars/${folder}/${avatarNum}.svg`;
}

export function ApplicantCard({ applicant, onSelect, onRatingChange, cvUrl }: ApplicantCardProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

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

  const avatarUrl = getRandomAvatar(applicant.gender, applicant.id);
  const skills = parseSkills(applicant.skills);

  const handleStarClick = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRatingChange?.(rating);
  };

  const openCV = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cvUrl) {
      window.open(cvUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer",
        "bg-gradient-to-br from-card to-card/80 hover:from-card hover:to-secondary/20",
        "border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        "hover:-translate-y-1"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100"
      )} />

      {/* Applications badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge 
          variant="secondary" 
          className="bg-primary/10 text-primary border-primary/20 font-semibold backdrop-blur-sm"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {applicant.total_applications} apps
        </Badge>
      </div>

      <CardContent className="p-6">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-3">
            <Avatar className={cn(
              "h-20 w-20 ring-4 ring-background shadow-lg transition-transform duration-300",
              isHovered && "scale-110"
            )}>
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary text-lg font-bold">
                {applicant.full_name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {applicant.gender && (
              <div className={cn(
                "absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                applicant.gender === 'female' 
                  ? "bg-pink-500/20 text-pink-600 border border-pink-500/30" 
                  : "bg-blue-500/20 text-blue-600 border border-blue-500/30"
              )}>
                {applicant.gender === 'female' ? '♀' : '♂'}
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-foreground text-lg leading-tight mb-1">
            {applicant.full_name}
          </h3>
          
          {applicant.age && (
            <span className="text-xs text-muted-foreground">
              {applicant.age} years old
            </span>
          )}
        </div>

        {/* Star Rating - Interactive */}
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              onClick={(e) => handleStarClick(i + 1, e)}
              onMouseEnter={() => setHoveredStar(i + 1)}
              onMouseLeave={() => setHoveredStar(null)}
              className="focus:outline-none transition-transform hover:scale-125"
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  (hoveredStar !== null ? i < hoveredStar : i < (applicant.rating || 0))
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                    : "text-muted-foreground/30 hover:text-amber-400/50"
                )}
              />
            </button>
          ))}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{applicant.email}</span>
          </div>
          {applicant.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{applicant.phone}</span>
            </div>
          )}
          {applicant.wilaya && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{applicant.wilaya}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skills.slice(0, 3).map((skill) => (
              <Badge 
                key={skill} 
                variant="outline" 
                className="text-xs bg-secondary/50 border-border/50"
              >
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                +{skills.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={onSelect}
          >
            View Profile
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
          {cvUrl && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-xs bg-primary/10 hover:bg-primary/20 text-primary"
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
