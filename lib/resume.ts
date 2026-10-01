export const RESUME_BUCKET = "resumes";
export const RESUME_MIME_TYPE = "application/pdf";
export const RESUME_MAX_SIZE_MB = 5;
export const RESUME_MAX_SIZE_BYTES = RESUME_MAX_SIZE_MB * 1024 * 1024;

export const RESUME_UNREADABLE_ERROR =
  "Could not extract text from this PDF. Please try a different file.";
export const RESUME_EXTRACTION_ERROR =
  "We couldn’t read your resume right now. Please try again.";

// One resume per user. Storage policies only allow keys under the user's own id.
export function getResumeKey(userId: string): string {
  return `${userId}/resume.pdf`;
}
