import { FIND_JOBS_PATH, getJobDetailsPath } from "@/lib/routes";
import type { JobSearchResult, Profile } from "@/types";

export const JOBS_PAGE_SIZE = 20;

export const JOB_SEARCH_LIMITS = {
  jobTitle: 100,
  location: 100,
} as const;

export const JOB_MATCH_FILTERS = ["all", "high", "low"] as const;
export type JobMatchFilter = (typeof JOB_MATCH_FILTERS)[number];

export const JOB_SORTS = ["score", "newest", "oldest"] as const;
export type JobSort = (typeof JOB_SORTS)[number];

// The state of the jobs list. It lives in the URL, so a filtered list can be
// reloaded, shared and reached with the back button.
export type JobListFilters = {
  query: string;
  match: JobMatchFilter;
  sort: JobSort;
  page: number;
};

export const JOB_FILTER_QUERY_LIMIT = 100;

export const DEFAULT_JOB_FILTERS: JobListFilters = {
  query: "",
  match: "all",
  sort: "score",
  page: 1,
};

type SearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

// Anything missing or not recognised falls back to the default, so a
// hand-edited URL never breaks the page.
export function parseJobFilters(params: SearchParams): JobListFilters {
  const match = firstValue(params.match);
  const sort = firstValue(params.sort);
  const page = Number(firstValue(params.page));

  return {
    query: firstValue(params.q).trim().slice(0, JOB_FILTER_QUERY_LIMIT),
    match:
      JOB_MATCH_FILTERS.find((value) => value === match) ??
      DEFAULT_JOB_FILTERS.match,
    sort:
      JOB_SORTS.find((value) => value === sort) ?? DEFAULT_JOB_FILTERS.sort,
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  };
}

function buildFilterSearch(filters: JobListFilters): string {
  const params = new URLSearchParams();

  if (filters.query !== "") {
    params.set("q", filters.query);
  }
  if (filters.match !== DEFAULT_JOB_FILTERS.match) {
    params.set("match", filters.match);
  }
  if (filters.sort !== DEFAULT_JOB_FILTERS.sort) {
    params.set("sort", filters.sort);
  }
  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params.toString();
}

export function buildFindJobsHref(filters: JobListFilters): string {
  const search = buildFilterSearch(filters);
  return search === "" ? FIND_JOBS_PATH : `${FIND_JOBS_PATH}?${search}`;
}

// A job's details link carries the list's filters and page, so Back to Jobs
// can return to the same view.
export function buildJobDetailsHref(
  jobId: string,
  filters: JobListFilters,
): string {
  const search = buildFilterSearch(filters);
  const path = getJobDetailsPath(jobId);
  return search === "" ? path : `${path}?${search}`;
}

export function hasActiveJobFilters(filters: JobListFilters): boolean {
  return filters.query !== "" || filters.match !== DEFAULT_JOB_FILTERS.match;
}

// The PostgREST `or` filter for "company or title contains the text", case
// insensitive. The text is user input: `\`, `%` and `_` are escaped so they
// match themselves in the LIKE pattern, and the value is double-quoted so a
// comma or bracket can't end the condition early.
export function buildJobTextFilter(query: string): string {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const quoted = `"${pattern.replace(/[\\"]/g, "\\$&")}"`;

  return `company.ilike.${quoted},title.ilike.${quoted}`;
}

export const JOB_SEARCH_ERROR =
  "We couldn’t complete this search. Please try again in a moment.";
// A missing server key: trying again will not help, so this does not say to
export const JOB_SEARCH_UNAVAILABLE_ERROR =
  "Job search isn’t available yet. Job scoring hasn’t been set up for this app.";
export const JOB_SEARCH_TITLE_ERROR = "Enter a job title to search for.";
export const JOB_SEARCH_PROFILE_ERROR =
  "Add your skills and current title to your profile before searching.";

// Scores are only as good as the profile they are measured against, so a
// search needs at least these two.
export function canSearchJobs(
  profile: Pick<Profile, "skills" | "current_title">,
): boolean {
  return (
    profile.skills.length > 0 && (profile.current_title ?? "").trim() !== ""
  );
}

const countLabel = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export function formatJobSearchMessage({
  found,
  strongMatches,
}: JobSearchResult): string {
  const matches =
    strongMatches === 1 ? "1 strong match" : `${strongMatches} strong matches`;

  return `Found ${countLabel(found, "job")} and saved ${matches}.`;
}
