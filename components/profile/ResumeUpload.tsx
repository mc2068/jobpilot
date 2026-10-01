"use client";

import {
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  CloudUpload,
  ExternalLink,
  FileText,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { uploadResume } from "@/actions/profile";
import { GenerateResumeRow } from "@/components/profile/GenerateResumeRow";
import {
  RESUME_GENERATION_ERROR,
  RESUME_MAX_SIZE_BYTES,
  RESUME_MAX_SIZE_MB,
  RESUME_MIME_TYPE,
} from "@/lib/resume";
import { RESUME_FILE_API_PATH, RESUME_GENERATE_API_PATH } from "@/lib/routes";
import type { ActionResult, ResultNotice } from "@/types";

type Props = {
  hasResume: boolean;
  isProfileComplete: boolean;
  isExtracting: boolean;
  onExtract: () => void;
};

const UPLOAD_ERROR = "We couldn’t upload your resume. Please try again.";
const GENERATED_NAME = "Resume generated from your profile";

export function ResumeUpload({
  hasResume,
  isProfileComplete,
  isExtracting,
  onExtract,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<ResultNotice | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const [isGenerating, startGenerating] = useTransition();

  const isUploaded = hasResume || uploadedName !== null;

  const handleGenerate = () => {
    setGenerateResult(null);

    startGenerating(async () => {
      try {
        const response = await fetch(RESUME_GENERATE_API_PATH, {
          method: "POST",
        });
        const result: ActionResult = await response.json();

        if (!result.success) {
          setGenerateResult({
            success: false,
            message: result.error ?? RESUME_GENERATION_ERROR,
          });
          return;
        }

        setUploadedName(GENERATED_NAME);
        setGenerateResult({
          success: true,
          message: "Your resume is ready. Use View resume to open it.",
        });
      } catch (generateError) {
        console.error("[profile/ResumeUpload]", generateError);
        setGenerateResult({ success: false, message: RESUME_GENERATION_ERROR });
      }
    });
  };

  const selectFile = (candidate: File | undefined) => {
    if (!candidate || isUploading || isGenerating) {
      return;
    }

    if (candidate.type !== RESUME_MIME_TYPE) {
      setError("That file isn’t a PDF. Please choose a PDF resume.");
      return;
    }

    if (candidate.size > RESUME_MAX_SIZE_BYTES) {
      setError(`That file is larger than ${RESUME_MAX_SIZE_MB}MB.`);
      return;
    }

    setError(null);
    setGenerateResult(null);
    setFileName(candidate.name);

    const formData = new FormData();
    formData.set("resume", candidate);

    startUpload(async () => {
      try {
        const result = await uploadResume(formData);

        if (result.success) {
          setUploadedName(candidate.name);
        } else {
          setError(result.error ?? UPLOAD_ERROR);
        }
      } catch (uploadError) {
        console.error("[profile/ResumeUpload]", uploadError);
        setError(UPLOAD_ERROR);
      }
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    // Lets the same file be picked again after a rejected attempt
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  let title = "Click to upload or drag and drop";
  let hint = `PDF formatting only. Maximum file size ${RESUME_MAX_SIZE_MB}MB.`;

  if (isUploading) {
    title = `Uploading ${fileName ?? "resume"}…`;
    hint = "This can take a few seconds.";
  } else if (isUploaded) {
    title = uploadedName ?? "Resume uploaded";
    hint = `Upload another PDF to replace it. Maximum file size ${RESUME_MAX_SIZE_MB}MB.`;
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Resume</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Upload an existing resume to auto-fill the profile, or generate a
            new tailored one from your details below.
          </p>
        </div>
        {isUploaded && !isUploading && !isGenerating && (
          <a
            href={RESUME_FILE_API_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            View resume
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      {/* The button inside is the keyboard path; its click bubbles up to here */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-busy={isUploading}
        className={`mt-5 flex flex-col items-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${
          isUploading ? "cursor-wait" : "cursor-pointer"
        } ${
          isDragging
            ? "border-accent bg-accent-muted"
            : "border-border bg-surface-secondary"
        }`}
      >
        <span className="flex size-14 items-center justify-center rounded-full border border-border bg-surface shadow-xs">
          {isUploading ? (
            <LoaderCircle className="size-6 animate-spin text-accent" />
          ) : isUploaded ? (
            <FileText className="size-6 text-accent" />
          ) : (
            <CloudUpload className="size-6 text-accent" />
          )}
        </span>
        <p
          role="status"
          className="mt-5 text-base font-semibold break-all text-text-primary"
        >
          {title}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{hint}</p>
        <button
          type="button"
          disabled={isUploading || isGenerating}
          className="mt-5 h-[42px] rounded-md border border-border bg-surface px-5 text-sm font-semibold text-text-dark shadow-xs transition-colors hover:bg-surface-secondary disabled:cursor-wait disabled:opacity-60"
        >
          {isUploaded ? "Replace Resume" : "Select Resume"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={RESUME_MIME_TYPE}
          disabled={isUploading || isGenerating}
          onChange={handleChange}
          onClick={(event) => event.stopPropagation()}
          className="hidden"
          aria-label="Resume PDF"
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-text-dark">
          {error}
        </p>
      )}

      {isUploaded && (
        <div className="mt-6 flex flex-col items-start gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-medium">
            Fill the empty fields below from your uploaded resume.
          </p>
          <button
            type="button"
            onClick={onExtract}
            disabled={isExtracting || isUploading || isGenerating}
            aria-busy={isExtracting}
            className="inline-flex h-[42px] shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-semibold text-text-dark shadow-xs transition-colors hover:bg-surface-secondary disabled:cursor-wait disabled:opacity-60"
          >
            {isExtracting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4 text-accent" />
            )}
            {isExtracting ? "Extracting…" : "Extract from Resume"}
          </button>
        </div>
      )}

      <GenerateResumeRow
        hasResume={isUploaded}
        isComplete={isProfileComplete}
        isGenerating={isGenerating}
        isBusy={isUploading || isExtracting}
        result={generateResult}
        onGenerate={handleGenerate}
      />
    </section>
  );
}
