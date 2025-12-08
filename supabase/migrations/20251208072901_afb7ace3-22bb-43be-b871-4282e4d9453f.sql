
-- Add new columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS max_applicants integer;

-- Add new columns to applicants table  
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 65),
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb;

-- Update skills column to be jsonb if it's text[]
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applicants' AND column_name = 'skills' AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE public.applicants ALTER COLUMN skills TYPE jsonb USING to_jsonb(skills);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_deadline ON public.jobs(status, deadline) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_applicants_rating ON public.applicants(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applicants_skills ON public.applicants USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications(job_id, status);

-- Create RPC function for dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
    total_jobs bigint,
    open_jobs bigint,
    closed_jobs bigint,
    total_applicants bigint,
    total_applications bigint,
    pending_applications bigint,
    reviewing_applications bigint,
    shortlisted_applications bigint,
    accepted_applications bigint,
    rejected_applications bigint,
    applications_today bigint,
    applications_this_week bigint,
    applications_this_month bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM jobs)::bigint as total_jobs,
        (SELECT COUNT(*) FROM jobs WHERE status = 'open')::bigint as open_jobs,
        (SELECT COUNT(*) FROM jobs WHERE status = 'closed')::bigint as closed_jobs,
        (SELECT COUNT(*) FROM applicants)::bigint as total_applicants,
        (SELECT COUNT(*) FROM applications)::bigint as total_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'pending')::bigint as pending_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'reviewing')::bigint as reviewing_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'shortlisted')::bigint as shortlisted_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'accepted')::bigint as accepted_applications,
        (SELECT COUNT(*) FROM applications WHERE status = 'rejected')::bigint as rejected_applications,
        (SELECT COUNT(*) FROM applications WHERE applied_at::date = CURRENT_DATE)::bigint as applications_today,
        (SELECT COUNT(*) FROM applications WHERE applied_at >= CURRENT_DATE - INTERVAL '7 days')::bigint as applications_this_week,
        (SELECT COUNT(*) FROM applications WHERE applied_at >= CURRENT_DATE - INTERVAL '30 days')::bigint as applications_this_month;
END;
$$;

-- Create RPC function for recent applications with full details
CREATE OR REPLACE FUNCTION public.get_recent_applications(limit_count integer DEFAULT 20)
RETURNS TABLE(
    application_id uuid,
    job_id uuid,
    job_title text,
    applicant_id uuid,
    applicant_name text,
    applicant_email text,
    applicant_avatar_url text,
    status text,
    applied_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as application_id,
        j.id as job_id,
        j.title as job_title,
        ap.id as applicant_id,
        ap.full_name as applicant_name,
        ap.email as applicant_email,
        ap.avatar_url as applicant_avatar_url,
        a.status::text,
        a.applied_at
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN applicants ap ON a.applicant_id = ap.id
    ORDER BY a.applied_at DESC
    LIMIT limit_count;
END;
$$;

-- Create RPC function to get job with statistics
CREATE OR REPLACE FUNCTION public.get_job_with_stats(job_id_param uuid)
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    image_url text,
    status text,
    deadline date,
    max_applicants integer,
    location text,
    job_type text,
    salary_range text,
    created_at timestamptz,
    total_applications bigint,
    pending_count bigint,
    reviewing_count bigint,
    shortlisted_count bigint,
    accepted_count bigint,
    rejected_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.description,
        j.image_url,
        j.status::text,
        j.deadline,
        j.max_applicants,
        j.location,
        j.job_type::text,
        j.salary_range,
        j.created_at,
        COUNT(a.id)::bigint as total_applications,
        COUNT(a.id) FILTER (WHERE a.status = 'pending')::bigint as pending_count,
        COUNT(a.id) FILTER (WHERE a.status = 'reviewing')::bigint as reviewing_count,
        COUNT(a.id) FILTER (WHERE a.status = 'shortlisted')::bigint as shortlisted_count,
        COUNT(a.id) FILTER (WHERE a.status = 'accepted')::bigint as accepted_count,
        COUNT(a.id) FILTER (WHERE a.status = 'rejected')::bigint as rejected_count
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.id = job_id_param
    GROUP BY j.id;
END;
$$;

-- Create RPC function to get all jobs with application counts
CREATE OR REPLACE FUNCTION public.get_all_jobs_with_counts()
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    image_url text,
    status text,
    deadline date,
    max_applicants integer,
    location text,
    job_type text,
    salary_range text,
    created_at timestamptz,
    total_applications bigint,
    is_deadline_passed boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.description,
        j.image_url,
        j.status::text,
        j.deadline,
        j.max_applicants,
        j.location,
        j.job_type::text,
        j.salary_range,
        j.created_at,
        COUNT(a.id)::bigint as total_applications,
        (j.deadline < CURRENT_DATE) as is_deadline_passed
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    GROUP BY j.id
    ORDER BY j.created_at DESC;
END;
$$;

-- Create RPC function for applicants with filters
CREATE OR REPLACE FUNCTION public.search_applicants_filtered(
    search_term text DEFAULT NULL,
    filter_gender text DEFAULT NULL,
    filter_wilaya text DEFAULT NULL,
    min_age integer DEFAULT NULL,
    max_age integer DEFAULT NULL,
    min_rating integer DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    full_name text,
    email text,
    phone text,
    gender text,
    wilaya text,
    age integer,
    avatar_url text,
    rating integer,
    skills jsonb,
    total_applications bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.id,
        ap.full_name,
        ap.email,
        ap.phone,
        ap.gender,
        ap.wilaya,
        ap.age,
        ap.avatar_url,
        ap.rating,
        ap.skills,
        COUNT(a.id)::bigint as total_applications
    FROM applicants ap
    LEFT JOIN applications a ON ap.id = a.applicant_id
    WHERE 
        (search_term IS NULL OR 
         ap.full_name ILIKE '%' || search_term || '%' OR
         ap.email ILIKE '%' || search_term || '%')
        AND (filter_gender IS NULL OR ap.gender = filter_gender)
        AND (filter_wilaya IS NULL OR ap.wilaya = filter_wilaya)
        AND (min_age IS NULL OR ap.age >= min_age)
        AND (max_age IS NULL OR ap.age <= max_age)
        AND (min_rating IS NULL OR ap.rating >= min_rating)
    GROUP BY ap.id
    ORDER BY ap.full_name;
END;
$$;

-- Create RPC function to get applicants for a job
CREATE OR REPLACE FUNCTION public.get_applicants_for_job(job_id_param uuid)
RETURNS TABLE(
    application_id uuid,
    applicant_id uuid,
    full_name text,
    email text,
    phone text,
    gender text,
    wilaya text,
    age integer,
    avatar_url text,
    rating integer,
    skills jsonb,
    education jsonb,
    experience jsonb,
    application_status text,
    cv_url text,
    cover_letter text,
    applied_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as application_id,
        ap.id as applicant_id,
        ap.full_name,
        ap.email,
        ap.phone,
        ap.gender,
        ap.wilaya,
        ap.age,
        ap.avatar_url,
        ap.rating,
        ap.skills,
        ap.education,
        ap.experience,
        a.status::text as application_status,
        a.cv_url,
        a.cover_letter,
        a.applied_at
    FROM applications a
    JOIN applicants ap ON a.applicant_id = ap.id
    WHERE a.job_id = job_id_param
    ORDER BY a.applied_at DESC;
END;
$$;

-- Create RPC function to update application status
CREATE OR REPLACE FUNCTION public.update_application_status(
    application_id_param uuid,
    new_status text
)
RETURNS TABLE(
    success boolean,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM applications WHERE id = application_id_param) THEN
        RETURN QUERY SELECT FALSE, 'Application not found'::text;
        RETURN;
    END IF;
    
    UPDATE applications
    SET status = new_status::application_status, updated_at = now()
    WHERE id = application_id_param;
    
    RETURN QUERY SELECT TRUE, 'Application status updated successfully'::text;
END;
$$;

-- Create RPC function to bulk update application status
CREATE OR REPLACE FUNCTION public.bulk_update_application_status(
    application_ids uuid[],
    new_status text
)
RETURNS TABLE(
    success boolean,
    updated_count integer,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE applications
    SET status = new_status::application_status, updated_at = now()
    WHERE id = ANY(application_ids);
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT TRUE, v_count, format('%s applications updated successfully', v_count)::text;
END;
$$;

-- Create RPC function to get job demographics
CREATE OR REPLACE FUNCTION public.get_job_demographics(job_id_param uuid)
RETURNS TABLE(
    total_applicants bigint,
    male_count bigint,
    female_count bigint,
    avg_age numeric,
    top_wilaya text,
    wilaya_distribution jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_applicants,
        COUNT(*) FILTER (WHERE ap.gender = 'male')::bigint as male_count,
        COUNT(*) FILTER (WHERE ap.gender = 'female')::bigint as female_count,
        ROUND(AVG(ap.age), 1) as avg_age,
        (
            SELECT wilaya 
            FROM applicants ap2
            JOIN applications a2 ON ap2.id = a2.applicant_id
            WHERE a2.job_id = job_id_param AND ap2.wilaya IS NOT NULL
            GROUP BY wilaya
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as top_wilaya,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'wilaya', wilaya,
                    'count', count
                ) ORDER BY count DESC
            )
            FROM (
                SELECT ap2.wilaya, COUNT(*)::integer as count
                FROM applicants ap2
                JOIN applications a2 ON ap2.id = a2.applicant_id
                WHERE a2.job_id = job_id_param AND ap2.wilaya IS NOT NULL
                GROUP BY ap2.wilaya
            ) subq
        ) as wilaya_distribution
    FROM applications a
    JOIN applicants ap ON a.applicant_id = ap.id
    WHERE a.job_id = job_id_param;
END;
$$;
