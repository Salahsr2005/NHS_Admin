"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { type RecruitmentStage, RECRUITMENT_STAGES } from "@/types/recruitment"

interface RecruitmentTimelineProps {
  currentStage: RecruitmentStage
  activeStage: RecruitmentStage
  onStageClick: (stage: RecruitmentStage) => void
  isFinalDecisionMade?: boolean
}

export function RecruitmentTimeline({
  currentStage,
  activeStage,
  onStageClick,
  isFinalDecisionMade,
}: RecruitmentTimelineProps) {
  const currentIndex = RECRUITMENT_STAGES.findIndex((s) => s.key === currentStage)

  const isStageComplete = (index: number): boolean => {
    if (index < currentIndex) return true
    if (index === currentIndex && isFinalDecisionMade) return true
    return false
  }

  // Only allow clicking on stages that have been reached (completed or current)
  const canClickStage = (index: number) => {
    return index <= currentIndex
  }

  return (
    <div className="w-full">
      {/* Desktop horizontal timeline */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${(currentIndex / (RECRUITMENT_STAGES.length - 1)) * 100}%` }}
        />

        {RECRUITMENT_STAGES.map((stage, index) => {
          const isCompleted = isStageComplete(index)
          const isCurrent = index === currentIndex && !isFinalDecisionMade
          const isActive = stage.key === activeStage
          const isClickable = canClickStage(index)

          return (
            <button
              key={stage.key}
              onClick={() => isClickable && onStageClick(stage.key)}
              disabled={!isClickable}
              className={cn(
                "relative z-10 flex flex-col items-center gap-2 transition-all rounded-lg p-2",
                isClickable
                  ? "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  : "cursor-not-allowed opacity-50",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 border-primary text-primary",
                  !isCompleted && !isCurrent && "bg-background border-border text-muted-foreground",
                  isActive && "ring-4 ring-primary/30",
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-medium">{index + 1}</span>}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-[80px]",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden space-y-2">
        {RECRUITMENT_STAGES.map((stage, index) => {
          const isCompleted = isStageComplete(index)
          const isCurrent = index === currentIndex && !isFinalDecisionMade
          const isActive = stage.key === activeStage
          const isClickable = canClickStage(index)

          return (
            <button
              key={stage.key}
              onClick={() => isClickable && onStageClick(stage.key)}
              disabled={!isClickable}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                isClickable
                  ? "hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  : "cursor-not-allowed opacity-50",
                isActive && "bg-primary/10 border border-primary/30",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 border-primary text-primary",
                  !isCompleted && !isCurrent && "bg-background border-border text-muted-foreground",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
              </div>
              <div className="text-left">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
