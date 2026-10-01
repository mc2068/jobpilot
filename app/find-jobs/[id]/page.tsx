import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, CircleAlert } from "lucide-react";

import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { Navbar } from "@/components/layout/Navbar";
import { createInsforgeServer } from "@/lib/insforge-server";
import { isJobId } from "@/lib/job-details";
import { buildFindJobsHref, parseJobFilters } from "@/lib/job-search";
import { LOGIN_PATH } from "@/lib/routes";
import type { JobDetails } from "@/types";

export const metadata: Metadata = {
  title: "Job Details · JobPilot",
};

const JOB_COLUMNS =
  "id, company, title, match_score, salary, found_at, source_url, external_apply_url, location, job_type, about_role, match_reason, matched_skills, missing_skills";

// Null when the job could not be read. A job that does not exist, or belongs
// to someone else, is a 404.
async function loadJob(jobId: string): Promise<JobDetails | null> {
  if (!isJobId(jobId)) {
    notFound();
  }

  const insforge = await createInsforgeServer();
  const { data: auth, error: authError } = await insforge.auth.getCurrentUser();
  const user = auth?.user;

  if (authError || !user) {
    redirect(LOGIN_PATH);
  }

  const { data, error } = await insforge.database
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .eq("user_id", user.id)
    .limit(1);

  if (error || !data) {
    console.error("[find-jobs/[id]/page]", error);
    return null;
  }

  const jobs: JobDetails[] = data;

  if (jobs.length === 0) {
    notFound();
  }

  return jobs[0];
}

export default async function JobDetailsPage({
  params,
  searchParams,
}: PageProps<"/find-jobs/[id]">) {
  const { id } = await params;
  // The list's filters and page ride along in the URL; parsing them again means
  // a hand-edited URL can only ever lead back to a valid list view.
  const backHref = buildFindJobsHref(parseJobFilters(await searchParams));
  const job = await loadJob(id);

  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[780px] flex-col gap-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-text-medium transition-colors hover:text-accent"
          >
            <ChevronLeft className="size-4" />
            Back to Jobs
          </Link>
          {job ? (
            <>
              <JobInfo job={job} />
              <MatchScore job={job} />
              <JobDescription description={job.about_role} />
              <CompanyResearch company={job.company} />
              <JobActions job={job} />
            </>
          ) : (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-text-dark shadow-sm"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
              We couldn’t load this job. Please refresh the page or sign in
              again.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
