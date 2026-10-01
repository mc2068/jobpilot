"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw, Search } from "lucide-react";

import { RESEARCH_ERROR } from "@/lib/research-messages";
import { AGENT_RESEARCH_API_PATH } from "@/lib/routes";
import type { ApiResult } from "@/types";

type Props = {
  jobId: string;
  // True when a dossier is already saved: the button then researches again
  hasResearch: boolean;
};

export function ResearchButton({ jobId, hasResearch }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isResearching, startResearching] = useTransition();

  const handleClick = () => {
    setError(null);

    startResearching(async () => {
      try {
        const response = await fetch(AGENT_RESEARCH_API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const result: ApiResult<{ researchedAt: string }> =
          await response.json();

        if (!result.success) {
          setError(result.error ?? RESEARCH_ERROR);
          return;
        }

        router.refresh();
      } catch (caught) {
        console.error("[job-details/ResearchButton]", caught);
        setError(RESEARCH_ERROR);
      }
    });
  };

  const Icon = isResearching ? LoaderCircle : hasResearch ? RefreshCw : Search;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isResearching}
        aria-busy={isResearching}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        <Icon className={`size-4 ${isResearching ? "animate-spin" : ""}`} />
        {isResearching
          ? "Researching…"
          : hasResearch
            ? "Research again"
            : "Research Company"}
      </button>
      {isResearching && (
        <p role="status" className="text-xs text-text-muted">
          Reading the company’s website. This can take up to a minute.
        </p>
      )}
      {!isResearching && error && (
        <p role="alert" className="max-w-[320px] text-xs text-error sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
