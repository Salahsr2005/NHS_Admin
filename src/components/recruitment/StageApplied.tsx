import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

interface StageAppliedProps {
  appliedAt: string;
  hrNotes: string;
  onHrNotesChange: (notes: string) => void;
  onSave: () => void;
  onAdvance: () => void;
  isSaving: boolean;
}

export function StageApplied({ 
  appliedAt, 
  hrNotes, 
  onHrNotesChange, 
  onSave, 
  onAdvance,
  isSaving 
}: StageAppliedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
        <Calendar className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Application Date</p>
          <p className="font-medium text-foreground">
            {format(new Date(appliedAt), 'MMMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hr-notes">Initial HR Review Notes</Label>
        <Textarea
          id="hr-notes"
          placeholder="Add initial review notes about the application..."
          value={hrNotes}
          onChange={(e) => onHrNotesChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onSave} variant="outline" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Notes'}
        </Button>
        <Button onClick={onAdvance} className="gap-2">
          Move to Screening
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
