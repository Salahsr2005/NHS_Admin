export type JobStatus = "open" | "closed" | "on_hold"
export type JobType = "full_time" | "part_time" | "contract" | "internship" | "remote"
// Added "offered" to the status list
export type ApplicationStatus = "pending" | "reviewing" | "shortlisted" | "offered" | "rejected" | "accepted"

export interface Job {
  id: string
  title: string
  description: string | null
  location: string
  job_type: JobType
  salary_range: string | null
  status: JobStatus
  deadline: string | null
  image_url: string | null
  max_applicants: number | null
  created_at: string
  updated_at: string
}

export interface JobWithStats extends Job {
  total_applications: number
  pending_count: number
  reviewing_count: number
  shortlisted_count: number
  accepted_count: number
  rejected_count: number
  is_deadline_passed?: boolean
}

export interface Applicant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  address: string | null
  gender: "male" | "female" | null
  wilaya: string | null
  age: number | null
  avatar_url: string | null
  rating: number | null
  skills: string[] | null
  education: any[] | null
  experience: any[] | null
  cv_url: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  status: ApplicationStatus
  cv_url: string | null
  cover_letter: string | null
  applied_at: string
  updated_at: string
  hr_notes?: string | null
  screening_notes?: string | null
  interview_date?: string | null
  interview_notes?: string | null
  technical_score?: number | null
  proposed_salary?: string | null
  offer_status?: string | null
  final_notes?: string | null
  stage_history?: any | null
  job?: Job
  applicant?: Applicant
}