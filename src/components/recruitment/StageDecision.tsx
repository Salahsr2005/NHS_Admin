import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, PartyPopper, AlertTriangle } from 'lucide-react';
import { FinalDecision } from '@/types/recruitment';

interface StageDecisionProps {
  finalNotes: string;
  onFinalNotesChange: (notes: string) => void;
  finalDecision: FinalDecision | null;
  onHire: () => void;
  onReject: () => void;
  isSaving: boolean;
}

export function StageDecision({ 
  finalNotes,
  onFinalNotesChange,
  finalDecision,
  onHire, 
  onReject,
  isSaving 
}: StageDecisionProps) {
  if (finalDecision === 'hired') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-emerald-600">Candidate Hired!</h3>
          <p className="text-muted-foreground mt-2">
            This candidate has been successfully hired. Welcome them to the team!
          </p>
        </div>
      </div>
    );
  }

  if (finalDecision === 'rejected') {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-red-600">Application Rejected</h3>
          <p className="text-muted-foreground mt-2">
            This application has been closed. The candidate was not selected for this position.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Final Hiring Decision</h3>
        <p className="text-sm text-muted-foreground">
          Make the final decision for this candidate
        </p>
      </div>

      {/* Final Notes */}
      <div className="space-y-2">
        <Label htmlFor="final-notes">Final Closing Notes</Label>
        <Textarea
          id="final-notes"
          placeholder="Add any final notes or comments about this hiring decision..."
          value={finalNotes}
          onChange={(e) => onFinalNotesChange(e.target.value)}
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Decision Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <Button 
          onClick={onHire} 
          size="lg"
          className="h-20 text-lg font-bold gap-3 bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-500/25 transition-all"
          disabled={isSaving}
        >
          <UserCheck className="h-6 w-6" />
          HIRE
        </Button>
        <Button 
          onClick={onReject} 
          size="lg"
          variant="destructive"
          className="h-20 text-lg font-bold gap-3 shadow-lg hover:shadow-red-500/25 transition-all"
          disabled={isSaving}
        >
          <UserX className="h-6 w-6" />
          REJECT
        </Button>
      </div>
    </div>
  );
}
