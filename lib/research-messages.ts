// Kept apart from lib/company-research.ts: the browser needs these strings,
// and that module pulls in zod.
export const RESEARCH_ERROR =
  "We couldn’t research this company. Please try again in a moment.";
// A missing server key: trying again will not help, so this does not say to
export const RESEARCH_UNAVAILABLE_ERROR =
  "Company research isn’t available yet. The research service hasn’t been set up for this app.";
export const RESEARCH_JOB_ERROR = "We couldn’t find this job to research.";
