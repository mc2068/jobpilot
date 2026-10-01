import { FileText } from "lucide-react";

import { ADZUNA_URL } from "@/lib/job-details";

type Props = {
  description: string | null;
};

export function JobDescription({ description }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
          <FileText className="size-4 text-text-secondary" />
        </span>
        <h2 className="text-base font-semibold text-text-primary">
          Job Description
        </h2>
      </div>
      {description ? (
        <p className="mt-4 text-[15px] leading-[22px] break-words whitespace-pre-line text-text-primary">
          {description}
        </p>
      ) : (
        <p className="mt-4 text-sm text-text-muted">
          This listing came without a description. Open the job post to read
          it.
        </p>
      )}
      {/* Adzuna's terms require this credit wherever its listings are shown */}
      <a
        href={ADZUNA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-xs text-text-muted hover:text-text-secondary"
      >
        Jobs by Adzuna
      </a>
    </section>
  );
}
