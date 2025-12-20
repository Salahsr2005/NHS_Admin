export type RecruitmentStage = "applied" | "test_stage" | "interview" | "offer" | "decision"
export type OfferStatus = "pending" | "accepted" | "declined" | "negotiating"
export type FinalDecision = "hired" | "rejected"

export interface StageHistoryEntry {
  stage: RecruitmentStage
  notes?: string
  updated_at: string
  updated_by?: string
}

export interface ApplicationWithRecruitment {
  id: string
  job_id: string
  applicant_id: string
  status: string
  applied_at: string
  updated_at: string
  cv_url?: string | null
  cover_letter?: string | null
  hr_notes?: string | null
  screening_notes?: string | null
  interview_date?: string | null
  interview_notes?: string | null
  technical_score?: number | null
  proposed_salary?: string | null
  offer_status?: string | null
  final_notes?: string | null
  stage_history?: StageHistoryEntry[] | null
  job?: {
    id: string
    title: string
    location: string
  }
  applicant?: {
    id: string
    full_name: string
    email: string
    phone?: string
    gender?: string
    wilaya?: string
    age?: number
    avatar_url?: string
    rating?: number
    skills?: any
    education?: any[]
    experience?: any[]
    address?: string
    created_at?: string
    updated_at?: string
  }
}

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
      return "reviewing"
    case "offer":
      return "shortlisted"
    case "decision":
      return "shortlisted"
    default:
      return "pending"
  }
}
