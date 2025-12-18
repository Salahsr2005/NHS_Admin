import { useState } from 'react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageInterviewProps {
  interviewDate: Date | undefined;
  onInterviewDateChange: (date: Date | undefined) => void;
  interviewNotes: string;
  onInterviewNotesChange: (notes: string) => void;
  technicalScore: number;
  onTechnicalScoreChange: (score: number) => void;
  onMoveToOffer: () => void;
  onReject: () => void;
  isSaving: boolean;
}

export function StageInterview({ 
  interviewDate,
  onInterviewDateChange,
  interviewNotes, 
  onInterviewNotesChange, 
  technicalScore,
  onTechnicalScoreChange,
  onMoveToOffer, 
  onReject,
  isSaving 
}: StageInterviewProps) {
  const [interviewTime, setInterviewTime] = useState('10:00');

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = interviewTime.split(':').map(Number);
      date.setHours(hours, minutes);
    }
    onInterviewDateChange(date);
  };

  const handleTimeChange = (time: string) => {
    setInterviewTime(time);
    if (interviewDate) {
      const newDate = new Date(interviewDate);
      const [hours, minutes] = time.split(':').map(Number);
      newDate.setHours(hours, minutes);
      onInterviewDateChange(newDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interview Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Interview Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !interviewDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {interviewDate ? format(interviewDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={interviewDate}
                onSelect={handleDateSelect}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interview-time">Interview Time</Label>
          <Input
            id="interview-time"
            type="time"
            value={interviewTime}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      </div>

      {/* Technical Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Technical Score</Label>
          <span className="text-lg font-bold text-primary">{technicalScore}/10</span>
        </div>
        <Slider
          value={[technicalScore]}
          onValueChange={(value) => onTechnicalScoreChange(value[0])}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Poor</span>
          <span>Average</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Interview Notes */}
      <div className="space-y-2">
        <Label htmlFor="interview-notes">Interviewer Feedback</Label>
        <Textarea
          id="interview-notes"
          placeholder="Document interview observations, candidate strengths, areas of concern..."
          value={interviewNotes}
          onChange={(e) => onInterviewNotesChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          onClick={onMoveToOffer} 
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={isSaving}
        >
          Move to Offer
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onReject} 
          variant="destructive"
          className="flex-1 gap-2"
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
      </div>
    </div>
  );
}
