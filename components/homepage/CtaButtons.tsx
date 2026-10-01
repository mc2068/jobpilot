import { Play } from "lucide-react";

import { TrackedLink } from "@/components/analytics/TrackedLink";

type Props = {
  primaryHref: string;
};

export function CtaButtons({ primaryHref }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <TrackedLink
        href={primaryHref}
        event="primary_cta_clicked"
        properties={{ destination: primaryHref }}
        className="inline-flex h-12 items-center gap-2.5 rounded-md bg-text-slate bg-linear-to-b from-surface/10 to-transparent px-8 text-base font-medium text-surface transition-opacity hover:opacity-90"
      >
        Get Started
        <Play className="size-3 fill-current text-surface/60" strokeWidth={0} />
      </TrackedLink>
      <TrackedLink
        href="/find-jobs"
        event="job_search_cta_clicked"
        className="inline-flex h-12 items-center rounded-md border border-text-slate/10 bg-surface/40 px-8 text-base font-medium text-text-slate transition-colors hover:bg-surface/70"
      >
        Find Your First Match
      </TrackedLink>
    </div>
  );
}
