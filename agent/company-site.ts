import { getDomain } from "tldts";

import { UNKNOWN_COMPANY } from "@/lib/adzuna";

export const MAX_SUB_PAGES = 3;

// Pages with less text than this are a parked domain, a login wall or an
// empty script shell, not research.
export const MIN_PAGE_CHARS = 200;

// A job posting often lands on the job board or applicant tracking system
// that hosts it. That domain is not the employer's, so it is never a homepage.
const JOB_BOARD_DOMAINS = new Set([
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "workday.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "icims.com",
  "jobvite.com",
  "bamboohr.com",
  "recruitee.com",
  "breezy.hr",
  "teamtailor.com",
  "personio.de",
  "personio.com",
  "pinpointhq.com",
  "join.com",
  "taleo.net",
  "successfactors.com",
  "oraclecloud.com",
  "paylocity.com",
  "ultipro.com",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "monster.com",
  "careerbuilder.com",
  "simplyhired.com",
  "jooble.org",
  "talent.com",
  "dice.com",
  "wellfound.com",
  "reed.co.uk",
  "totaljobs.com",
  "cwjobs.co.uk",
]);

// Adzuna has a domain per country (adzuna.com, adzuna.co.uk, ...)
const isJobBoardDomain = (domain: string): boolean =>
  domain.startsWith("adzuna.") || JOB_BOARD_DOMAINS.has(domain);

// Where a job posting link ended up, as the employer's own site, or null when
// it ended up somewhere that is not one: a job board, an IP address, a
// non-web link. "jobs.stripe.com" becomes "https://stripe.com".
export function homepageFromLandingUrl(landingUrl: string): string | null {
  let url: URL;

  try {
    url = new URL(landingUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  // null for localhost, IP addresses and anything without a public suffix
  const domain = getDomain(url.hostname);

  if (!domain || isJobBoardDomain(domain)) {
    return null;
  }

  return `https://${domain}`;
}

const LEGAL_SUFFIX_PATTERN =
  /\b(inc|incorporated|llc|ltd|limited|plc|gmbh|corp|corporation|co|company|sa|ag|bv|pty)\b\.?/g;

// A last-resort guess from the company name alone: "Acme Widgets, Inc." becomes
// "https://www.acmewidgets.com". Null for a name with nothing to guess from.
export function guessHomepageFromName(company: string): string | null {
  if (company.trim() === UNKNOWN_COMPANY) {
    return null;
  }

  const slug = company
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(LEGAL_SUFFIX_PATTERN, " ")
    .replace(/[^a-z0-9]/g, "");

  return slug === "" ? null : `https://www.${slug}.com`;
}

// The homepages to try, best first: where the posting really led, then the
// name guess. Empty when neither is usable.
export function candidateHomepages(
  landingUrl: string | null,
  company: string,
): string[] {
  const candidates = [
    landingUrl ? homepageFromLandingUrl(landingUrl) : null,
    guessHomepageFromName(company),
  ].filter((url): url is string => url !== null);

  return [...new Set(candidates)];
}

// The kinds of page worth reading when researching an employer, best first.
// A group is matched against the first two path segments, so /company/about
// counts.
const LINK_GROUPS: { name: string; segments: string[] }[] = [
  {
    name: "about",
    segments: ["about", "about-us", "company", "our-story", "story", "mission"],
  },
  {
    name: "engineering",
    segments: ["engineering", "tech", "technology", "developers"],
  },
  {
    name: "product",
    segments: ["product", "products", "platform", "solutions"],
  },
  { name: "blog", segments: ["blog", "news", "newsroom"] },
  { name: "team", segments: ["team", "culture", "values", "people"] },
  { name: "careers", segments: ["careers", "jobs", "join-us"] },
];

const SKIPPED_EXTENSION_PATTERN =
  /\.(pdf|png|jpe?g|gif|svg|webp|ico|zip|mp4|mp3|xml|json|css|js)$/i;

const MARKDOWN_LINK_PATTERN = /\]\(\s*<?([^)\s>]+)/g;

// Up to `limit` internal pages worth reading, picked from the links in the
// homepage's markdown: the best page of each kind (about before engineering
// before product, careers last), then more of the same kinds if there is room.
// Links to other sites, files and the homepage itself are ignored.
export function rankSubPageLinks(
  markdown: string,
  homepageUrl: string,
  limit: number = MAX_SUB_PAGES,
): string[] {
  const home = new URL(homepageUrl);
  const homeDomain = getDomain(home.hostname);
  const found = new Map<string, string[]>();
  const seen = new Set<string>();

  for (const match of markdown.matchAll(MARKDOWN_LINK_PATTERN)) {
    let url: URL;

    try {
      url = new URL(match[1], home);
    } catch {
      continue;
    }

    url.hash = "";
    url.search = "";
    const path = url.pathname.replace(/\/+$/, "");

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      getDomain(url.hostname) !== homeDomain ||
      path === "" ||
      SKIPPED_EXTENSION_PATTERN.test(path)
    ) {
      continue;
    }

    const key = `${url.origin}${path}`;

    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const segments = path.toLowerCase().split("/").filter(Boolean).slice(0, 2);
    const group = LINK_GROUPS.find((candidate) =>
      segments.some((segment) => candidate.segments.includes(segment)),
    );

    if (!group) {
      continue;
    }

    found.set(group.name, [...(found.get(group.name) ?? []), key]);
  }

  // Shorter paths first inside a kind: /about before /about/our-history
  const queues = LINK_GROUPS.map((group) =>
    (found.get(group.name) ?? []).sort((a, b) => a.length - b.length),
  );
  const picked: string[] = [];

  for (let round = 0; picked.length < limit; round++) {
    const before = picked.length;

    for (const queue of queues) {
      if (picked.length < limit && queue[round]) {
        picked.push(queue[round]);
      }
    }

    if (picked.length === before) {
      break;
    }
  }

  return picked;
}

const IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g;
const LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g;

// Page text for the model: links keep their label but lose the URL, images go,
// blank runs collapse. Cuts the tokens a menu-heavy homepage would cost.
export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(IMAGE_PATTERN, "")
    .replace(LINK_PATTERN, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
