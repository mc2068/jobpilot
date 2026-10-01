import { z } from "zod";

export const ADZUNA_COUNTRIES = ["us", "gb", "au", "ca"] as const;

export type AdzunaCountry = (typeof ADZUNA_COUNTRIES)[number];

export const DEFAULT_ADZUNA_COUNTRY: AdzunaCountry = "us";

export type AdzunaJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  // A snippet, not the full posting
  description: string;
  redirectUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  contractType: string | null;
};

const API_BASE_URL = "https://api.adzuna.com/v1/api/jobs";
// More than a search keeps: Adzuna lists one posting once per location, and
// agent/adzuna.ts drops those repeats before scoring.
const RESULTS_PER_PAGE = 30;
const REQUEST_TIMEOUT_MS = 15_000;
// Saved as jobs.company when Adzuna has none; company research must not treat
// it as a name to look up.
export const UNKNOWN_COMPANY = "Company not listed";

const adzunaJobSchema = z.object({
  id: z.coerce.string(),
  title: z.string(),
  description: z.string().nullish(),
  redirect_url: z.string(),
  company: z.object({ display_name: z.string().nullish() }).nullish(),
  location: z.object({ display_name: z.string().nullish() }).nullish(),
  salary_min: z.number().nullish(),
  salary_max: z.number().nullish(),
  contract_type: z.string().nullish(),
});

const adzunaResponseSchema = z.object({
  results: z.array(z.unknown()).nullish(),
});

// Adzuna wraps the matched search terms in <strong> tags
const cleanText = (value: string): string =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function toAdzunaJob(result: unknown): AdzunaJob | null {
  const parsed = adzunaJobSchema.safeParse(result);

  if (!parsed.success) {
    return null;
  }

  const job = parsed.data;
  const title = cleanText(job.title);

  if (title === "") {
    return null;
  }

  return {
    id: job.id,
    title,
    company: cleanText(job.company?.display_name ?? "") || UNKNOWN_COMPANY,
    location: cleanText(job.location?.display_name ?? "") || null,
    description: cleanText(job.description ?? ""),
    redirectUrl: job.redirect_url,
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    contractType: job.contract_type ?? null,
  };
}

export function isAdzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

// Throws on a missing key, a network failure or a non-2xx answer. The caller
// (agent/adzuna.ts) turns that into a failed run.
export async function searchJobs(
  what: string,
  where: string,
  country: AdzunaCountry = DEFAULT_ADZUNA_COUNTRY,
): Promise<AdzunaJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID or ADZUNA_APP_KEY is not set");
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what,
    category: "it-jobs",
    results_per_page: String(RESULTS_PER_PAGE),
    "content-type": "application/json",
  });

  if (where !== "") {
    params.set("where", where);
  }

  const response = await fetch(
    `${API_BASE_URL}/${country}/search/1?${params}`,
    { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = adzunaResponseSchema.parse(await response.json());

  return (data.results ?? [])
    .map(toAdzunaJob)
    .filter((job): job is AdzunaJob => job !== null);
}
