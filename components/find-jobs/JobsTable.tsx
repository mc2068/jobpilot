import Link from "next/link";
import { Building2 } from "lucide-react";

import { MatchScoreBar } from "@/components/find-jobs/MatchScoreBar";
import { buildJobDetailsHref, type JobListFilters } from "@/lib/job-search";
import { FIND_JOBS_PATH } from "@/lib/routes";
import { formatTimeAgo } from "@/lib/utils";
import type { JobListItem } from "@/types";

type Props = {
  jobs: JobListItem[];
  // The list's filters and page, passed on to each job so Back to Jobs returns here
  filters: JobListFilters;
  // True when a text or match filter is on, so an empty list is not "no jobs yet"
  isFiltered: boolean;
};

const HEADER_CLASS =
  "h-12 px-3 text-xs font-semibold tracking-[0.05em] text-text-secondary uppercase";

export function JobsTable({ jobs, filters, isFiltered }: Props) {
  if (jobs.length === 0) {
    return (
      <p className="px-6 py-16 text-center text-sm text-text-muted">
        {isFiltered ? (
          <>
            No jobs match these filters.{" "}
            <Link
              href={FIND_JOBS_PATH}
              className="font-semibold text-accent hover:opacity-80"
            >
              Clear filters
            </Link>
          </>
        ) : (
          "No jobs yet. Search for a job title above to find your first matches."
        )}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] table-fixed border-collapse">
        <colgroup>
          <col className="w-[23.5%]" />
          <col className="w-[20.5%]" />
          <col className="w-[24%]" />
          <col className="w-[18%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="bg-surface-secondary">
            <th scope="col" className={`${HEADER_CLASS} pl-11 text-left`}>
              Company
            </th>
            <th scope="col" className={`${HEADER_CLASS} text-left`}>
              Role
            </th>
            <th scope="col" className={`${HEADER_CLASS} text-center`}>
              Match Score
            </th>
            <th scope="col" className={`${HEADER_CLASS} text-left`}>
              Salary Est.
            </th>
            <th scope="col" className={`${HEADER_CLASS} text-left`}>
              Date Found
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="relative border-t border-border transition-colors focus-within:bg-surface-secondary hover:bg-surface-secondary"
            >
              <td className="h-16 pr-3 pl-11">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-light bg-surface-tertiary">
                    <Building2 className="size-4 text-text-secondary" />
                  </span>
                  {/* The link's ::after covers the row, so the whole row opens the job */}
                  <Link
                    href={buildJobDetailsHref(job.id, filters)}
                    aria-label={`${job.title} at ${job.company}`}
                    className="truncate text-sm font-semibold text-text-primary outline-none after:absolute after:inset-0 focus-visible:text-accent"
                  >
                    {job.company}
                  </Link>
                </div>
              </td>
              <td className="truncate px-3 text-sm text-text-dark">
                {job.title}
              </td>
              <td className="px-3">
                <MatchScoreBar score={job.match_score} />
              </td>
              <td className="truncate px-3 text-sm text-text-medium">
                {job.salary ?? "Not listed"}
              </td>
              <td className="truncate px-3 text-sm text-text-secondary">
                {formatTimeAgo(job.found_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
