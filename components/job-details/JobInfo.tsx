import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { JobInfoCard } from "@/components/job-details/JobInfoCard";
import { MISSING_VALUE, formatJobType, getSafeUrl } from "@/lib/job-details";
import { MATCH_THRESHOLD, formatTimeAgo } from "@/lib/utils";
import type { JobDetails } from "@/types";

type Props = {
  job: JobDetails;
};

export function JobInfo({ job }: Props) {
  const postUrl = getSafeUrl(job.source_url);
  const isStrongMatch = job.match_score >= MATCH_THRESHOLD;

  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary">
            <Building2 className="size-6 text-text-muted" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[-0.01em] break-words text-text-primary">
              {job.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm text-text-secondary">{job.company}</span>
              <span aria-hidden className="text-sm text-text-muted">
                •
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isStrongMatch
                    ? "bg-success-lightest text-success-foreground"
                    : "bg-surface-secondary text-text-secondary"
                }`}
              >
                {job.match_score}% Match Score
              </span>
            </div>
          </div>
        </div>
        {postUrl && (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-primary shadow-xs transition-colors hover:bg-surface-secondary"
          >
            <ExternalLink className="size-4" />
            View Job Post
          </a>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <JobInfoCard
          label="Salary Est."
          value={job.salary ?? MISSING_VALUE}
          icon={<DollarSign className="size-5" />}
          tone="success"
        />
        <JobInfoCard
          label="Location"
          value={job.location ?? MISSING_VALUE}
          icon={<MapPin className="size-5" />}
          tone="info"
        />
        <JobInfoCard
          label="Job Type"
          value={formatJobType(job.job_type)}
          icon={<Briefcase className="size-5" />}
          tone="accent"
        />
        <JobInfoCard
          label="Date Found"
          value={formatTimeAgo(job.found_at) || MISSING_VALUE}
          icon={<Calendar className="size-5" />}
          tone="neutral"
        />
      </div>
    </>
  );
}
