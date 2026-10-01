export const ADZUNA_URL = "https://www.adzuna.com";

// Shown in place of a value the listing does not have
export const MISSING_VALUE = "—";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The id comes from the URL. Anything that is not a uuid would make the
// database answer with a type error instead of "no rows".
export function isJobId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const JOB_TYPE_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  full_time: "Full-time",
  parttime: "Part-time",
  part_time: "Part-time",
  permanent: "Permanent",
  contract: "Contract",
};

// jobs.job_type is free text: known values get a label, anything else is
// shown as it was saved.
export function formatJobType(jobType: string | null): string {
  const value = (jobType ?? "").trim();

  if (value === "") {
    return MISSING_VALUE;
  }
  return JOB_TYPE_LABELS[value.toLowerCase()] ?? value;
}

// Listing URLs are saved from an outside API, so only a web link is ever
// put in an href.
export function getSafeUrl(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
