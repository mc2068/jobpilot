import type { InsForgeClient } from "@insforge/sdk";
import { getDomain } from "tldts";

import {
  candidateHomepages,
  cleanMarkdown,
  MIN_PAGE_CHARS,
  rankSubPageLinks,
} from "@/agent/company-site";
import {
  synthesizeDossier,
  type DossierJob,
  type ResearchPage,
} from "@/agent/dossier";
import { logAgent } from "@/agent/logs";
import type { AgentLogEntry, AgentLogLevel } from "@/agent/types";
import { fetchPageMarkdown } from "@/lib/browserbase";
import type { CompanyDossier } from "@/lib/company-research";
import { getSafeUrl } from "@/lib/job-details";
import type { Profile } from "@/types";

// Per page, in characters of cleaned markdown: about 5 to 6 pages of text in
// all, well inside what one Haiku call reads.
const HOMEPAGE_CHARS = 8_000;
const SUB_PAGE_CHARS = 5_000;
const REDIRECT_TIMEOUT_MS = 8_000;

export type ResearchJob = DossierJob & {
  id: string;
  source_url: string | null;
  external_apply_url: string | null;
};

export type ResearchInput = {
  userId: string;
  job: ResearchJob;
  profile: Profile;
};

export type ResearchResult =
  | { success: true; dossier: CompanyDossier }
  | { success: false; error: string };

type Log = (level: AgentLogLevel, message: string) => void;

// Where the job's apply link ends up once its redirects are followed. An
// Adzuna link leads to the employer's own posting, which names the employer's
// domain. Only the final address is read: the page body is never downloaded.
async function findLandingUrl(link: string | null): Promise<string | null> {
  const url = getSafeUrl(link);

  // Only a real public host is requested: no IP address, no localhost
  if (!url || !getDomain(new URL(url).hostname)) {
    return null;
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REDIRECT_TIMEOUT_MS),
      headers: { "user-agent": "Mozilla/5.0 (compatible; JobPilot/1.0)" },
    });

    void response.body?.cancel();
    return response.url;
  } catch (error) {
    console.error("[agent/research] redirect", error);
    return null;
  }
}

async function readPage(
  url: string,
  maxChars: number,
  log: Log,
): Promise<{ page: ResearchPage; markdown: string } | null> {
  const markdown = await fetchPageMarkdown(url);
  const text = markdown ? cleanMarkdown(markdown) : "";

  if (!markdown || text.length < MIN_PAGE_CHARS) {
    log("warning", `Could not read ${url}.`);
    return null;
  }

  return { page: { url, text: text.slice(0, maxChars) }, markdown };
}

// The homepage and up to three pages linked from it. Empty when no website
// could be found or read: the dossier is then written from the job and profile.
async function readCompanySite(
  job: ResearchJob,
  log: Log,
): Promise<ResearchPage[]> {
  const landingUrl = await findLandingUrl(
    job.external_apply_url ?? job.source_url,
  );

  for (const homepageUrl of candidateHomepages(landingUrl, job.company)) {
    const home = await readPage(homepageUrl, HOMEPAGE_CHARS, log);

    if (!home) {
      continue;
    }

    const subPages = await Promise.all(
      rankSubPageLinks(home.markdown, homepageUrl).map((url) =>
        readPage(url, SUB_PAGE_CHARS, log),
      ),
    );

    return [
      home.page,
      ...subPages.flatMap((subPage) => (subPage ? [subPage.page] : [])),
    ];
  }

  return [];
}

// Never throws. Always ends with the dossier or a reason it could not be
// written; a website that could not be read is not a failure.
export async function researchCompany(
  insforge: InsForgeClient,
  { userId, job, profile }: ResearchInput,
): Promise<ResearchResult> {
  const entries: AgentLogEntry[] = [];
  const log: Log = (level, message) =>
    entries.push({ userId, runId: null, jobId: job.id, level, message });

  try {
    log("info", `Researching ${job.company}.`);

    const pages = await readCompanySite(job, log);

    if (pages.length === 0) {
      log(
        "warning",
        "No pages from the company website could be read. Using the job posting and profile only.",
      );
    }

    const result = await synthesizeDossier(pages, job, profile);

    if (!result.success) {
      log("error", `The dossier could not be written: ${result.error}`);
      return { success: false, error: result.error };
    }

    log("success", `Dossier ready, from ${pages.length} website page(s).`);

    return {
      success: true,
      dossier: {
        ...result.dossier,
        sources: pages.map((page) => page.url),
        researchedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[agent/research]", error);
    log("error", "The research failed unexpectedly.");
    return { success: false, error: "The research failed unexpectedly." };
  } finally {
    await logAgent(insforge, entries);
  }
}
