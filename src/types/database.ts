export type JobStatus = 'open' | 'closed' | 'on_hold';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';

export interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string;
  job_type: JobType;
  salary_range: string | null;
  status: JobStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  skills: string[] | null;
  wilaya: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  cv_url: string | null;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  job?: Job;
  applicant?: Applicant;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
