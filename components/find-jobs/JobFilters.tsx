"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { FilterSelect } from "@/components/find-jobs/FilterSelect";
import {
  JOB_FILTER_QUERY_LIMIT,
  buildFindJobsHref,
  type JobListFilters,
  type JobMatchFilter,
  type JobSort,
} from "@/lib/job-search";

type Props = {
  // The filters the list below was loaded with, read from the URL by the page
  filters: JobListFilters;
};

const MATCH_OPTIONS: { value: JobMatchFilter; label: string }[] = [
  { value: "all", label: "All Matches" },
  { value: "high", label: "High Match" },
  { value: "low", label: "Low Match" },
];

const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: "score", label: "Match Score" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

const TYPING_DELAY_MS = 300;

export function JobFilters({ filters }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters.query);
  const [appliedQuery, setAppliedQuery] = useState(filters.query);
  const [shownFilters, setShownFilters] = useOptimistic(filters);
  const [, startNavigation] = useTransition();
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The URL changed under the input (back button, Clear filters): follow it,
  // unless it only caught up with what is being typed.
  if (filters.query !== appliedQuery) {
    setAppliedQuery(filters.query);
    if (filters.query !== draft.trim()) {
      setDraft(filters.query);
    }
  }

  useEffect(
    () => () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    },
    [],
  );

  // Any change to a filter starts again from the first page
  const applyFilters = (changes: Partial<JobListFilters>): void => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    const next: JobListFilters = {
      ...filters,
      query: draft.trim(),
      ...changes,
      page: 1,
    };

    // The dropdowns show the new choice while the list is still loading
    startNavigation(() => {
      setShownFilters(next);
      router.replace(buildFindJobsHref(next), { scroll: false });
    });
  };

  const handleQueryChange = (value: string): void => {
    setDraft(value);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    typingTimer.current = setTimeout(() => {
      applyFilters({ query: value.trim() });
    }, TYPING_DELAY_MS);
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <label className="flex h-8 flex-1 items-center gap-2 rounded-md px-1 focus-within:ring-1 focus-within:ring-accent">
        <Search className="size-4 shrink-0 text-text-muted" />
        <input
          type="search"
          name="query"
          aria-label="Filter by company or role"
          placeholder="Filter by company or role..."
          value={draft}
          maxLength={JOB_FILTER_QUERY_LIMIT}
          onChange={(event) => handleQueryChange(event.target.value)}
          className="h-full w-full bg-transparent text-sm text-text-darkest outline-none placeholder:text-text-muted"
        />
      </label>

      <span className="hidden h-8 w-px bg-border sm:block" />

      <div className="flex gap-2">
        <FilterSelect
          name="match"
          label="Filter by match"
          options={MATCH_OPTIONS}
          value={shownFilters.match}
          onChange={(match) => applyFilters({ match })}
        />
        <FilterSelect
          name="sort"
          label="Sort jobs"
          options={SORT_OPTIONS}
          value={shownFilters.sort}
          onChange={(sort) => applyFilters({ sort })}
        />
      </div>
    </section>
  );
}
