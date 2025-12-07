-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('open', 'closed', 'on_hold');

-- Create enum for job type
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'remote');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted');

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    job_type public.job_type NOT NULL DEFAULT 'full_time',
    salary_range TEXT,
    status public.job_status NOT NULL DEFAULT 'open',
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applicants table
CREATE TABLE public.applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    skills TEXT[],
    wilaya TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    status public.application_status NOT NULL DEFAULT 'pending',
    cv_url TEXT,
    cover_letter TEXT,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(job_id, applicant_id)
);

-- Create profiles table for admin users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for jobs (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view jobs" ON public.jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create jobs" ON public.jobs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update jobs" ON public.jobs
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete jobs" ON public.jobs
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for applicants
CREATE POLICY "Authenticated users can view applicants" ON public.applicants
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create applicants" ON public.applicants
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update applicants" ON public.applicants
    FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for applications
CREATE POLICY "Authenticated users can view applications" ON public.applications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create applications" ON public.applications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update applications" ON public.applications
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete applications" ON public.applications
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON public.applicants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();