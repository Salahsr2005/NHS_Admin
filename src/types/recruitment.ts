export type RecruitmentStage = "applied" | "test_stage" | "interview" | "offer" | "decision"
export type OfferStatus = "pending" | "accepted" | "declined" | "negotiating"
export type FinalDecision = "hired" | "rejected"

export const RECRUITMENT_STAGES: { key: RecruitmentStage; label: string; description: string }[] = [
  { key: "applied", label: "Applied", description: "Initial application received" },
  { key: "test_stage", label: "Test Stage", description: "Technical assessment and evaluation" },
  { key: "interview", label: "Interview", description: "Interview scheduling and feedback" },
  { key: "offer", label: "Offer", description: "Salary negotiation and offer" },
  { key: "decision", label: "Decision", description: "Final hiring decision" },
]

export function statusToStage(status: string): RecruitmentStage {
  switch (status) {
    case "pending":
      return "applied"
    case "reviewing":
      return "test_stage"
    case "shortlisted":
      return "interview"
    case "offered": // Handle the offer stage
      return "offer"
    case "accepted":
    case "rejected":
      return "decision"
    default:
      return "applied"
  }
}

export function stageToStatus(stage: RecruitmentStage): string {
  switch (stage) {
    case "applied":
      return "pending"
    case "test_stage":
      return "reviewing"
    case "interview":
      return "shortlisted"
    case "offer":
      return "offered" // Map offer stage to offered status
    case "decision":
      return "accepted" // Default decision outcome (overridden by specific buttons)
  }
}