import {
  DEFAULT_ADZUNA_COUNTRY,
  type AdzunaCountry,
  type AdzunaJob,
} from "@/lib/adzuna";

export type ParsedLocation = {
  country: AdzunaCountry;
  // What goes in Adzuna's `where`. Empty means the parameter is left out.
  where: string;
  isRemote: boolean;
};

const REMOTE_WORDS = /\b(remote|anywhere|worldwide)\b/gi;

// A part that is only a country name is dropped from `where`
const COUNTRY_NAMES: Record<string, AdzunaCountry> = {
  us: "us",
  usa: "us",
  "united states": "us",
  "united states of america": "us",
  america: "us",
  uk: "gb",
  gb: "gb",
  "united kingdom": "gb",
  "great britain": "gb",
  britain: "gb",
  canada: "ca",
  australia: "au",
};

// These pick the country but stay in `where`: they narrow the search
const REGION_NAMES: Record<string, AdzunaCountry> = {
  england: "gb",
  scotland: "gb",
  wales: "gb",
  "northern ireland": "gb",
};

// Safe to read off the end of a part with no comma ("London UK"). Short or
// ambiguous names are left out: "CA" is California and "New England" is in the US.
const COUNTRY_SUFFIXES = [
  "united states of america",
  "united states",
  "united kingdom",
  "australia",
  "canada",
  "usa",
  "uk",
];

const normalizePart = (value: string): string =>
  value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

export function parseLocation(text: string): ParsedLocation {
  let country: AdzunaCountry | null = null;
  const isRemote = text.search(REMOTE_WORDS) !== -1;
  const whereParts: string[] = [];

  const parts = text
    .replace(REMOTE_WORDS, " ")
    .split(/[,/()|]+|\s+-\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "");

  for (const part of parts) {
    const key = normalizePart(part);

    if (key in COUNTRY_NAMES) {
      country ??= COUNTRY_NAMES[key];
      continue;
    }

    if (key in REGION_NAMES) {
      country ??= REGION_NAMES[key];
      whereParts.push(part);
      continue;
    }

    const suffix = COUNTRY_SUFFIXES.find((name) => key.endsWith(` ${name}`));

    if (suffix) {
      country ??= COUNTRY_NAMES[suffix];
      const place = part.split(/\s+/).slice(0, -suffix.split(" ").length);
      whereParts.push(place.join(" "));
      continue;
    }

    whereParts.push(part);
  }

  return {
    country: country ?? DEFAULT_ADZUNA_COUNTRY,
    where: whereParts.join(", "),
    isRemote,
  };
}

// Adzuna's `where` is a place lookup, so "remote" has to be a keyword
export function buildSearchTerms(jobTitle: string, isRemote: boolean): string {
  const title = jobTitle.trim();
  return isRemote && !/\bremote\b/i.test(title) ? `${title} remote` : title;
}

function formatAmount(value: number, symbol: string): string {
  return value >= 1000
    ? `${symbol}${Math.round(value / 1000)}k`
    : `${symbol}${Math.round(value)}`;
}

export function formatSalary(
  salaryMin: number | null,
  salaryMax: number | null,
  country: AdzunaCountry,
): string | null {
  if (salaryMin === null || salaryMin <= 0) {
    return null;
  }

  const symbol = country === "gb" ? "£" : "$";
  const low = formatAmount(salaryMin, symbol);

  if (salaryMax === null || salaryMax <= salaryMin) {
    return low;
  }

  const high = formatAmount(salaryMax, symbol);
  return high === low ? low : `${low} - ${high}`;
}

const postingKey = (job: AdzunaJob): string =>
  `${job.company.toLowerCase()}|${job.title.toLowerCase()}`;

// Adzuna lists one posting once per location. The table shows company and
// role only, so those repeats would be identical rows: the first one is kept.
export function pickUniqueJobs(jobs: AdzunaJob[], limit: number): AdzunaJob[] {
  const seen = new Set<string>();
  const unique: AdzunaJob[] = [];

  for (const job of jobs) {
    const key = postingKey(job);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(job);
  }

  return unique.slice(0, limit);
}
