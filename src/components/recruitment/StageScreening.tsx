"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"

interface StageScreeningProps {
  screeningNotes: string
  onScreeningNotesChange: (notes: string) => void
  onPassToInterview: () => void
  onReject: () => void
  isSaving: boolean
}

export function StageScreening({
  screeningNotes,
  onScreeningNotesChange,
  onPassToInterview,
  onReject,
  isSaving,
}: StageScreeningProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="test-stage-notes">Test Stage Notes</Label>
        <Textarea
          id="test-stage-notes"
          placeholder="Document technical assessment results, test scores, and evaluation observations..."
          value={screeningNotes}
          onChange={(e) => onScreeningNotesChange(e.target.value)}
          className="min-h-[150px] resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={onPassToInterview}
          className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={isSaving}
        >
          Pass to Interview
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button onClick={onReject} variant="destructive" className="flex-1 gap-2" disabled={isSaving}>
          <X className="h-4 w-4" />
          Reject Application
        </Button>
      </div>
    </div>
  )
}
