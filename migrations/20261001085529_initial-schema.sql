-- 04 Database Schema: profiles, agent_runs, jobs, agent_logs, row level security,
-- the new-user profile trigger, and own-folder policies for the resumes bucket.
-- Columns follow context/architecture.md.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  email               TEXT,
  phone               TEXT,
  location            TEXT,
  current_title       TEXT,
  experience_level    TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
  years_experience    INTEGER CHECK (years_experience >= 0),
  skills              TEXT[] NOT NULL DEFAULT '{}',
  industries          TEXT[] NOT NULL DEFAULT '{}',
  work_experience     JSONB NOT NULL DEFAULT '[]'::jsonb,
  education           JSONB,
  job_titles_seeking  TEXT[] NOT NULL DEFAULT '{}',
  remote_preference   TEXT CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'any')),
  preferred_locations TEXT[] NOT NULL DEFAULT '{}',
  salary_expectation  TEXT,
  cover_letter_tone   TEXT CHECK (cover_letter_tone IN ('formal', 'casual', 'enthusiastic')),
  linkedin_url        TEXT,
  portfolio_url       TEXT,
  work_authorization  TEXT CHECK (work_authorization IN ('citizen', 'permanent_resident', 'visa_required')),
  resume_pdf_url      TEXT,
  is_complete         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.agent_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  job_title_searched TEXT,
  location_searched  TEXT,
  jobs_found         INTEGER NOT NULL DEFAULT 0,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ
);

-- job_type has no CHECK: Adzuna's contract values do not map onto a fixed list.
CREATE TABLE public.jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source             TEXT NOT NULL DEFAULT 'search' CHECK (source IN ('search', 'url')),
  source_url         TEXT,
  external_apply_url TEXT,
  title              TEXT NOT NULL,
  company            TEXT NOT NULL,
  location           TEXT,
  salary             TEXT,
  job_type           TEXT,
  about_role         TEXT,
  responsibilities   TEXT[] NOT NULL DEFAULT '{}',
  requirements       TEXT[] NOT NULL DEFAULT '{}',
  nice_to_have       TEXT[] NOT NULL DEFAULT '{}',
  benefits           TEXT[] NOT NULL DEFAULT '{}',
  about_company      TEXT,
  match_score        INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_reason       TEXT,
  matched_skills     TEXT[] NOT NULL DEFAULT '{}',
  missing_skills     TEXT[] NOT NULL DEFAULT '{}',
  company_research   JSONB,
  found_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- run_id is nullable: company research logs belong to a job, not a run.
CREATE TABLE public.agent_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     UUID REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  level      TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'success', 'warning', 'error')),
  job_id     UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX agent_runs_user_started_idx ON public.agent_runs (user_id, started_at DESC);

CREATE INDEX jobs_user_found_idx ON public.jobs (user_id, found_at DESC);
CREATE INDEX jobs_user_score_idx ON public.jobs (user_id, match_score DESC);
CREATE INDEX jobs_run_idx ON public.jobs (run_id);

CREATE INDEX agent_logs_user_created_idx ON public.agent_logs (user_id, created_at DESC);
CREATE INDEX agent_logs_run_idx ON public.agent_logs (run_id);
CREATE INDEX agent_logs_job_idx ON public.agent_logs (job_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- Every user gets a profile row at sign-up, so the foreign keys above and
-- every later feature can rely on it existing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill accounts created before this migration.
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.agent_runs, public.jobs, public.agent_logs FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- profiles: no DELETE. The row lives and dies with the auth user.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY profiles_owner_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_owner_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_runs TO authenticated;

CREATE POLICY agent_runs_owner_select ON public.agent_runs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_insert ON public.agent_runs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_update ON public.agent_runs
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY agent_runs_owner_delete ON public.agent_runs
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;

CREATE POLICY jobs_owner_select ON public.jobs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_insert ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_update ON public.jobs
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY jobs_owner_delete ON public.jobs
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- agent_logs: append-only for users. Rows go away only by cascade.
GRANT SELECT, INSERT ON public.agent_logs TO authenticated;

CREATE POLICY agent_logs_owner_select ON public.agent_logs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY agent_logs_owner_insert ON public.agent_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: resumes bucket, own folder only ({user_id}/resume.pdf)
-- ---------------------------------------------------------------------------

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY resumes_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket = 'resumes'
    AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY resumes_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket = 'resumes'
    AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY resumes_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket = 'resumes'
    AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  )
  WITH CHECK (
    bucket = 'resumes'
    AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY resumes_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket = 'resumes'
    AND (storage.foldername(key))[1] = (SELECT auth.jwt() ->> 'sub')
  );

GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
