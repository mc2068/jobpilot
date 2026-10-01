import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { InsForgeClient } from "@insforge/sdk";
import { CircleAlert } from "lucide-react";

import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  JOBS_PAGE_SIZE,
  buildFindJobsHref,
  buildJobTextFilter,
  canSearchJobs,
  hasActiveJobFilters,
  parseJobFilters,
  type JobListFilters,
} from "@/lib/job-search";
import { LOGIN_PATH } from "@/lib/routes";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { JobListItem } from "@/types";

export const metadata: Metadata = {
  title: "Find Jobs · JobPilot",
};

type FindJobsData = {
  canSearch: boolean;
  // Null when the jobs could not be read
  jobs: JobListItem[] | null;
  total: number;
};

function queryJobs(
  insforge: InsForgeClient,
  userId: string,
  filters: JobListFilters,
) {
  let query = insforge.database
    .from("jobs")
    .select("id, company, title, match_score, salary, found_at", {
      count: "exact",
    })
    .eq("user_id", userId);

  if (filters.match === "high") {
    query = query.gte("match_score", MATCH_THRESHOLD);
  }
  if (filters.match === "low") {
    query = query.lt("match_score", MATCH_THRESHOLD);
  }
  if (filters.query !== "") {
    query = query.or(buildJobTextFilter(filters.query));
  }
  if (filters.sort === "score") {
    query = query.order("match_score", { ascending: false });
  }

  const oldestFirst = filters.sort === "oldest";
  const offset = (filters.page - 1) * JOBS_PAGE_SIZE;

  return (
    query
      .order("found_at", { ascending: oldestFirst })
      // Jobs from one search share a timestamp, so the id keeps the order stable
      .order("id", { ascending: oldestFirst })
      .range(offset, offset + JOBS_PAGE_SIZE - 1)
  );
}

async function loadFindJobs(filters: JobListFilters): Promise<FindJobsData> {
  const insforge = await createInsforgeServer();
  const { data: auth, error: authError } = await insforge.auth.getCurrentUser();
  const user = auth?.user;

  if (authError || !user) {
    redirect(LOGIN_PATH);
  }

  const [profileResult, jobsResult] = await Promise.all([
    insforge.database
      .from("profiles")
      .select("skills, current_title")
      .eq("id", user.id)
      .single(),
    queryJobs(insforge, user.id, filters),
  ]);

  // A page past the end (a stale link, or filters that now match fewer jobs)
  // comes back empty or as a range error: start again from the first page.
  if (
    filters.page > 1 &&
    (jobsResult.error || (jobsResult.data ?? []).length === 0)
  ) {
    redirect(buildFindJobsHref({ ...filters, page: 1 }));
  }

  if (profileResult.error || !profileResult.data) {
    console.error("[find-jobs/page] profile", profileResult.error);
  }

  if (jobsResult.error || !jobsResult.data) {
    console.error("[find-jobs/page] jobs", jobsResult.error);
  }

  const jobs: JobListItem[] | null = jobsResult.error
    ? null
    : (jobsResult.data ?? []);

  return {
    canSearch: profileResult.data ? canSearchJobs(profileResult.data) : false,
    jobs,
    total: jobsResult.count ?? jobs?.length ?? 0,
  };
}

export default async function FindJobsPage({
  searchParams,
}: PageProps<"/find-jobs">) {
  const filters = parseJobFilters(await searchParams);
  const { canSearch, jobs, total } = await loadFindJobs(filters);
  const firstRow = (filters.page - 1) * JOBS_PAGE_SIZE + 1;

  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1332px] flex-col gap-6">
          <SearchControls canSearch={canSearch} />
          <JobFilters filters={filters} />
          {jobs ? (
            <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <JobsTable
                jobs={jobs}
                filters={filters}
                isFiltered={hasActiveJobFilters(filters)}
              />
              {jobs.length > 0 && (
                <JobsPagination
                  filters={filters}
                  totalPages={Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE))}
                  from={firstRow}
                  to={firstRow + jobs.length - 1}
                  total={total}
                />
              )}
            </section>
          ) : (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-text-dark shadow-sm"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
              We couldn’t load your jobs. Please refresh the page or sign in
              again.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
