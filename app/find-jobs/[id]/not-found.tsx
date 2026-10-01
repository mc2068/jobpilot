import Link from "next/link";

import { Navbar } from "@/components/layout/Navbar";
import { FIND_JOBS_PATH } from "@/lib/routes";

export default function JobNotFound() {
  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-[780px] rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-sm">
          <h1 className="text-base font-semibold text-text-primary">
            Job not found
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            This job doesn’t exist or is no longer in your list.
          </p>
          <Link
            href={FIND_JOBS_PATH}
            className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Back to Jobs
          </Link>
        </div>
      </main>
    </>
  );
}
