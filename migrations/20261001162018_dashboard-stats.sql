-- 15 Stats Bar: the dashboard's four numbers for the signed-in user, in one row.
-- PostgREST aggregates are switched off on this backend, so the average needs a
-- function. SECURITY INVOKER keeps row level security on public.jobs in force.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_jobs integer,
  avg_match_score numeric,
  companies_researched integer,
  jobs_this_week integer,
  -- The average over jobs found more than 7 days ago: what the average was a
  -- week ago. Null when there is no such job.
  avg_match_score_before_week numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT
    count(*)::integer,
    avg(match_score),
    (count(*) FILTER (WHERE company_research IS NOT NULL))::integer,
    (count(*) FILTER (WHERE found_at >= now() - interval '7 days'))::integer,
    avg(match_score) FILTER (WHERE found_at < now() - interval '7 days')
  FROM public.jobs
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
