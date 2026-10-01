import { getSafeUrl } from "@/lib/job-details";
import type { JobDetails } from "@/types";

type Props = {
  job: Pick<JobDetails, "company" | "external_apply_url" | "source_url">;
};

export function JobActions({ job }: Props) {
  const applyUrl =
    getSafeUrl(job.external_apply_url) ?? getSafeUrl(job.source_url);

  if (!applyUrl) {
    return null;
  }

  return (
    <a
      href={applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-11 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
    >
      <span className="truncate">Apply Now at {job.company}</span>
    </a>
  );
}
