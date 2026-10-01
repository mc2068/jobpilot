import type { InsForgeClient } from "@insforge/sdk";

import { logAgent } from "@/agent/logs";
import { scoreJob } from "@/agent/matcher";
import {
  buildSearchTerms,
  formatSalary,
  parseLocation,
  pickUniqueJobs,
} from "@/agent/search-query";
import type {
  AgentLogEntry,
  DiscoveryResult,
  JobMatch,
} from "@/agent/types";
import { searchJobs, type AdzunaCountry, type AdzunaJob } from "@/lib/adzuna";
import { JOB_SEARCH_ERROR } from "@/lib/job-search";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Profile } from "@/types";

type DiscoveryInput = {
  userId: string;
  runId: string;
  profile: Profile;
  jobTitle: string;
  location: string;
};

type JobContext = Pick<DiscoveryInput, "userId" | "runId"> & {
  country: AdzunaCountry;
};

const DEFAULT_JOB_TYPE = "fulltime";
// One Claude call each, so this is also the cost of a search
const MAX_JOBS_PER_SEARCH = 10;

function toJobRecord(
  job: AdzunaJob,
  match: JobMatch,
  { userId, runId, country }: JobContext,
) {
  return {
    user_id: userId,
    run_id: runId,
    source: "search",
    source_url: job.redirectUrl,
    external_apply_url: job.redirectUrl,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: formatSalary(job.salaryMin, job.salaryMax, country),
    job_type: job.contractType ?? DEFAULT_JOB_TYPE,
    about_role: job.description || null,
    match_score: match.matchScore,
    match_reason: match.matchReason,
    matched_skills: match.matchedSkills,
    missing_skills: match.missingSkills,
    found_at: new Date().toISOString(),
  };
}

// Searches Adzuna, scores every result against the profile at the same time,
// and saves the ones that got a score. A job that fails to score is skipped
// with a warning; the run only fails when nothing can be saved.
export async function discoverJobs(
  insforge: InsForgeClient,
  { userId, runId, profile, jobTitle, location }: DiscoveryInput,
): Promise<DiscoveryResult> {
  const log = { userId, runId };

  try {
    const { country, where, isRemote } = parseLocation(location);
    const jobs = pickUniqueJobs(
      await searchJobs(buildSearchTerms(jobTitle, isRemote), where, country),
      MAX_JOBS_PER_SEARCH,
    );

    if (jobs.length === 0) {
      await logAgent(insforge, {
        ...log,
        level: "info",
        message: `No jobs found for "${jobTitle}".`,
      });
      return { success: true, matchScores: [], strongMatches: 0 };
    }

    const scored = await Promise.all(
      jobs.map(async (job) => ({ job, result: await scoreJob(profile, job) })),
    );

    const records = [];
    const skipped: AgentLogEntry[] = [];

    for (const { job, result } of scored) {
      if (result.success) {
        records.push(
          toJobRecord(job, result.match, { userId, runId, country }),
        );
        continue;
      }

      skipped.push({
        ...log,
        level: "warning",
        message: `Skipped "${job.title}" at ${job.company}: ${result.error}`,
      });
    }

    if (records.length === 0) {
      // Every job failed, almost always for one shared reason: one line says it
      const reason = scored.find(({ result }) => !result.success)?.result;

      await logAgent(insforge, {
        ...log,
        level: "error",
        message: `Found ${jobs.length} jobs for "${jobTitle}" but none could be scored. ${
          reason && !reason.success ? reason.error : ""
        }`.trim(),
      });
      return { success: false, error: JOB_SEARCH_ERROR };
    }

    await logAgent(insforge, skipped);

    const { error: insertError } = await insforge.database
      .from("jobs")
      .insert(records);

    if (insertError) {
      console.error("[agent/adzuna] insert", insertError);
      await logAgent(insforge, {
        ...log,
        level: "error",
        message: `Could not save the jobs found for "${jobTitle}".`,
      });
      return { success: false, error: JOB_SEARCH_ERROR };
    }

    const matchScores = records.map((record) => record.match_score);
    const strongMatches = matchScores.filter(
      (score) => score >= MATCH_THRESHOLD,
    ).length;

    await logAgent(insforge, {
      ...log,
      level: "success",
      message: `Saved ${records.length} jobs for "${jobTitle}", ${strongMatches} strong matches.`,
    });

    return { success: true, matchScores, strongMatches };
  } catch (error) {
    console.error("[agent/adzuna]", error);
    await logAgent(insforge, {
      ...log,
      level: "error",
      message: `The job search for "${jobTitle}" failed.`,
    });
    return { success: false, error: JOB_SEARCH_ERROR };
  }
}
