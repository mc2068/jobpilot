import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { PROFILE_PATH } from "@/lib/routes";

type Props = {
  percent: number;
};

export function ProfileBanner({ percent }: Props) {
  return (
    // The tint is translucent, so it needs a white layer underneath
    <section className="rounded-xl bg-surface shadow-sm">
      <div className="flex flex-col items-start gap-4 rounded-xl border border-error/15 bg-error/1 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Your profile is {percent}% complete
            </h2>
            <p className="mt-1 text-sm text-text-dark">
              Finish it to get accurate job matches and a resume built from
              your profile.
            </p>
          </div>
        </div>
        <Link
          href={PROFILE_PATH}
          className="inline-flex h-10 shrink-0 items-center rounded-md bg-accent px-6 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Complete profile
        </Link>
      </div>
    </section>
  );
}
