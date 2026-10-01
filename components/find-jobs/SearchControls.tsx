"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, Sparkles } from "lucide-react";

import { FormField } from "@/components/profile/FormField";
import { ResultMessage } from "@/components/profile/ResultMessage";
import { TextInput } from "@/components/profile/TextInput";
import {
  JOB_SEARCH_ERROR,
  JOB_SEARCH_LIMITS,
  JOB_SEARCH_PROFILE_ERROR,
  JOB_SEARCH_TITLE_ERROR,
  formatJobSearchMessage,
} from "@/lib/job-search";
import { AGENT_FIND_API_PATH, PROFILE_PATH } from "@/lib/routes";
import type { ApiResult, JobSearchResult } from "@/types";

type Props = {
  // False until the saved profile has the skills and title scoring needs
  canSearch: boolean;
};

type SearchOutcome =
  | { kind: "found"; message: string }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function SearchControls({ canSearch }: Props) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const [isSearching, startSearching] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const jobTitle = String(form.get("jobTitle") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();

    if (jobTitle === "") {
      setOutcome({ kind: "error", message: JOB_SEARCH_TITLE_ERROR });
      return;
    }

    setOutcome(null);

    startSearching(async () => {
      try {
        const response = await fetch(AGENT_FIND_API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle, location }),
        });
        const result: ApiResult<JobSearchResult> = await response.json();

        if (!result.success || !result.data) {
          setOutcome({
            kind: "error",
            message: result.error ?? JOB_SEARCH_ERROR,
          });
          return;
        }

        if (result.data.found === 0) {
          setOutcome({ kind: "empty" });
          return;
        }

        setOutcome({
          kind: "found",
          message: formatJobSearchMessage(result.data),
        });
        router.refresh();
      } catch (error) {
        console.error("[find-jobs/SearchControls]", error);
        setOutcome({ kind: "error", message: JOB_SEARCH_ERROR });
      }
    });
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 lg:flex-row lg:items-end"
      >
        <FormField label="Job Title" htmlFor="job-title" className="flex-1">
          <TextInput
            id="job-title"
            name="jobTitle"
            type="text"
            placeholder="Frontend Engineer"
            required
            maxLength={JOB_SEARCH_LIMITS.jobTitle}
            icon={<Search className="size-4" />}
          />
        </FormField>

        <FormField label="Location" htmlFor="job-location" className="flex-1">
          <TextInput
            id="job-location"
            name="location"
            type="text"
            placeholder="Remote, New York..."
            maxLength={JOB_SEARCH_LIMITS.location}
          />
        </FormField>

        <button
          type="submit"
          disabled={!canSearch || isSearching}
          aria-busy={isSearching}
          className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60 ${
            canSearch ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"
          }`}
        >
          {isSearching ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          {isSearching ? "Searching…" : "Find Jobs"}
        </button>
      </form>

      {!canSearch && (
        <p className="mt-4 text-sm text-text-medium">
          {JOB_SEARCH_PROFILE_ERROR}{" "}
          <Link
            href={PROFILE_PATH}
            className="font-semibold text-accent hover:opacity-80"
          >
            Go to profile
          </Link>
        </p>
      )}

      {!isSearching && outcome?.kind === "found" && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-md border border-success-light/60 bg-success-lightest px-3 py-3 text-sm font-medium text-success-dark"
        >
          <Sparkles className="size-4 shrink-0 text-success-alt" />
          {outcome.message}
        </p>
      )}

      {!isSearching && outcome?.kind === "empty" && (
        <p role="status" className="mt-4 text-sm text-text-medium">
          No jobs found for this search. Try a broader job title or a different
          location.
        </p>
      )}

      {!isSearching && outcome?.kind === "error" && (
        <ResultMessage success={false} message={outcome.message} className="mt-4" />
      )}
    </section>
  );
}
