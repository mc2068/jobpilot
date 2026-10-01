"use client";

import { useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";

import { ResultMessage } from "@/components/profile/ResultMessage";
import type { ResultNotice } from "@/types";

type Props = {
  hasResume: boolean;
  isComplete: boolean;
  isGenerating: boolean;
  // Another resume action (upload, extract) is running
  isBusy: boolean;
  result: ResultNotice | null;
  onGenerate: () => void;
};

export function GenerateResumeRow({
  hasResume,
  isComplete,
  isGenerating,
  isBusy,
  result,
  onGenerate,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = () => {
    // Generating overwrites the stored file, so ask when there is one to lose
    if (hasResume) {
      setIsConfirming(true);
      return;
    }

    onGenerate();
  };

  const handleConfirm = () => {
    setIsConfirming(false);
    onGenerate();
  };

  let helper = "Need a fresh document based on your saved profile?";

  if (!isComplete) {
    helper = "Complete and save your profile to generate a resume.";
  } else if (isConfirming) {
    helper =
      "This replaces your current resume with one generated from your saved profile.";
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-medium">{helper}</p>
        {isConfirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="h-10 rounded-md border border-border bg-surface px-5 text-sm font-semibold text-text-dark shadow-xs transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              className="h-10 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              Replace Resume
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={!isComplete || isGenerating || isBusy}
            aria-busy={isGenerating}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60 ${
              isComplete ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"
            }`}
          >
            {isGenerating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {isGenerating ? "Generating…" : "Generate Resume from Profile"}
          </button>
        )}
      </div>
      {result && !isGenerating && !isConfirming && (
        <ResultMessage
          success={result.success}
          message={result.message}
          className="mt-4"
        />
      )}
    </div>
  );
}
