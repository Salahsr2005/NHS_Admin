export type JobStatus = "open" | "closed" | "on_hold"
export type JobType = "full_time" | "part_time" | "contract" | "internship" | "remote"
export type ApplicationStatus = "pending" | "reviewing" | "shortlisted" | "rejected" | "accepted"

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
  full_name: string
  email: string
  phone: string | null
  address: string | null
  gender: "male" | "female" | null
  wilaya: string | null
  age: number | null
  avatar_url: string | null
  rating: number | null
  skills: string[] | null
  education: EducationItem[] | null
  experience: ExperienceItem[] | null
  created_at: string
  updated_at: string
}

export interface EducationItem {
  degree: string
  school: string
  year: string
}

export interface ExperienceItem {
  title: string
  company: string
  duration: string
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

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_jobs: number
  open_jobs: number
  closed_jobs: number
  total_applicants: number
  total_applications: number
  pending_applications: number
  reviewing_applications: number
  shortlisted_applications: number
  accepted_applications: number
  rejected_applications: number
  applications_today: number
  applications_this_week: number
  applications_this_month: number
}

export interface RecentApplication {
  application_id: string
  job_id: string
  job_title: string
  applicant_id: string
  applicant_name: string
  applicant_email: string
  applicant_avatar_url: string | null
  status: string
  applied_at: string
}

export interface JobDemographics {
  total_applicants: number
  male_count: number
  female_count: number
  avg_age: number | null
  top_wilaya: string | null
  wilaya_distribution: { wilaya: string; count: number }[] | null
}
