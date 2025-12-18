import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, X, DollarSign, Send } from 'lucide-react';
import { OfferStatus } from '@/types/recruitment';

interface StageOfferProps {
  proposedSalary: string;
  onProposedSalaryChange: (salary: string) => void;
  offerStatus: OfferStatus | null;
  onOfferStatusChange: (status: OfferStatus) => void;
  onMoveToDecision: () => void;
  onReject: () => void;
  isSaving: boolean;
}

export function StageOffer({ 
  proposedSalary,
  onProposedSalaryChange,
  offerStatus,
  onOfferStatusChange,
  onMoveToDecision, 
  onReject,
  isSaving 
}: StageOfferProps) {
  return (
    <div className="space-y-6">
      {/* Salary Details */}
      <div className="space-y-2">
        <Label htmlFor="proposed-salary">Proposed Salary / Position Details</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="proposed-salary"
            placeholder="e.g., $85,000/year + benefits, Senior Developer role"
            value={proposedSalary}
            onChange={(e) => onProposedSalaryChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Offer Status */}
      <div className="space-y-2">
        <Label>Offer Status</Label>
        <Select 
          value={offerStatus || ''} 
          onValueChange={(value) => onOfferStatusChange(value as OfferStatus)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select offer status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                Pending - Preparing offer
              </div>
            </SelectItem>
            <SelectItem value="sent">
              <div className="flex items-center gap-2">
                <Send className="h-3 w-3 text-blue-500" />
                Sent - Awaiting response
              </div>
            </SelectItem>
            <SelectItem value="accepted">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Accepted by candidate
              </div>
            </SelectItem>
            <SelectItem value="declined">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Declined by candidate
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Info */}
      {offerStatus === 'sent' && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
          <p className="text-blue-700 dark:text-blue-300">
            Offer has been sent. Waiting for candidate response.
          </p>
        </div>
      )}

      {offerStatus === 'accepted' && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
          <p className="text-emerald-700 dark:text-emerald-300">
            Great! The candidate has accepted the offer. Proceed to final decision.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          onClick={onMoveToDecision} 
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={isSaving}
        >
          Move to Final Decision
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onReject} 
          variant="destructive"
          className="flex-1 gap-2"
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
          Withdraw Offer
        </Button>
      </div>
    </div>
  );
}
