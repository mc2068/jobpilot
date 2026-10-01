import Link from "next/link";

import { ADZUNA_URL } from "@/lib/job-details";
import { buildFindJobsHref, type JobListFilters } from "@/lib/job-search";

type Props = {
  // The current filters and page: every link keeps them and changes the page
  filters: JobListFilters;
  totalPages: number;
  from: number;
  to: number;
  total: number;
};

type PageItem = number | "ellipsis";

const BUTTON_CLASS =
  "inline-flex h-8 items-center justify-center rounded-md border text-sm font-medium shadow-xs transition-colors";
const IDLE_CLASS =
  "border-border bg-surface text-text-medium hover:bg-surface-secondary";
const DISABLED_CLASS =
  "cursor-not-allowed border-border bg-surface text-text-muted";
const ACTIVE_CLASS = "border-accent-light bg-accent-muted text-accent";

// First page, last page and a window of three around the current one.
function getPageItems(page: number, totalPages: number): PageItem[] {
  const windowStart = Math.max(1, Math.min(page - 1, totalPages - 2));
  const pages = [1, windowStart, windowStart + 1, windowStart + 2, totalPages]
    .filter((value) => value >= 1 && value <= totalPages)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);

  return pages.flatMap((value, index) =>
    index > 0 && value - pages[index - 1] > 1 ? ["ellipsis", value] : [value],
  );
}

export function JobsPagination({
  filters,
  totalPages,
  from,
  to,
  total,
}: Props) {
  const { page } = filters;
  const hrefFor = (target: number): string =>
    buildFindJobsHref({ ...filters, page: target });

  return (
    <div className="flex flex-col gap-4 border-t border-border bg-surface-secondary/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-text-secondary">
          Showing{" "}
          <span className="font-semibold text-text-primary">{from}</span> to{" "}
          <span className="font-semibold text-text-primary">{to}</span> of{" "}
          <span className="font-semibold text-text-primary">{total}</span>{" "}
          results
        </p>
        {/* Adzuna's terms require this credit wherever its listings are shown */}
        <a
          href={ADZUNA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-text-muted hover:text-text-secondary"
        >
          Jobs by Adzuna
        </a>
      </div>

      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className={`${BUTTON_CLASS} ${IDLE_CLASS} px-3`}
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${BUTTON_CLASS} ${DISABLED_CLASS} px-3`}
          >
            Previous
          </span>
        )}

        {getPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="w-8 text-center text-sm text-text-muted"
            >
              ...
            </span>
          ) : (
            <Link
              key={item}
              href={hrefFor(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`${BUTTON_CLASS} w-8 ${item === page ? ACTIVE_CLASS : IDLE_CLASS}`}
            >
              {item}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className={`${BUTTON_CLASS} ${IDLE_CLASS} px-3`}
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${BUTTON_CLASS} ${DISABLED_CLASS} px-3`}
          >
            Next
          </span>
        )}
      </nav>
    </div>
  );
}
