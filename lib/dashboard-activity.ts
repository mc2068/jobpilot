import { z } from "zod";

import { formatTimeAgo } from "@/lib/utils";
import type { ActivityEntry } from "@/types";

// The design shows five entries; the list keeps the card as tall as the chart
// beside it.
export const RECENT_ACTIVITY_LIMIT = 5;

// A completed search: one agent_runs row
export const ACTIVITY_RUN_COLUMNS =
  "id, job_title_searched, jobs_found, completed_at";

// A researched job. Only the time is read from the dossier, never the dossier
// itself: it is the largest value in the table.
export const RESEARCHED_AT_PATH = "company_research->>researchedAt";
export const ACTIVITY_RESEARCH_COLUMNS = `id, company, researched_at:${RESEARCHED_AT_PATH}`;

const runSchema = z.object({
  id: z.string(),
  job_title_searched: z.string().nullable(),
  jobs_found: z.number().nullable(),
  completed_at: z.string(),
});

const researchSchema = z.object({
  id: z.string(),
  company: z.string(),
  researched_at: z.string(),
});

type DatedEntry = {
  timestamp: number;
  entry: ActivityEntry;
};

// A row that is not the expected shape is left out rather than failing the list
function parseRows<Row>(schema: z.ZodType<Row>, rows: unknown): Row[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.flatMap((row) => {
    const result = schema.safeParse(row);
    return result.success ? [result.data] : [];
  });
}

function describeRun(jobsFound: number, jobTitle: string | null): string {
  const title = jobTitle?.trim() || "your search";

  if (jobsFound === 0) {
    return `No jobs found for ${title}`;
  }
  return `Found ${jobsFound} ${jobsFound === 1 ? "job" : "jobs"} for ${title}`;
}

// Merges the user's latest searches and company research, newest first.
// Searches are green, research is blue.
export function buildRecentActivity(
  runRows: unknown,
  researchRows: unknown,
): ActivityEntry[] {
  const runs: DatedEntry[] = parseRows(runSchema, runRows).map((run) => ({
    timestamp: new Date(run.completed_at).getTime(),
    entry: {
      id: `run-${run.id}`,
      tone: "success",
      message: describeRun(run.jobs_found ?? 0, run.job_title_searched),
      time: formatTimeAgo(run.completed_at),
    },
  }));

  const research: DatedEntry[] = parseRows(researchSchema, researchRows).map(
    (job) => ({
      timestamp: new Date(job.researched_at).getTime(),
      entry: {
        id: `research-${job.id}`,
        tone: "info",
        message: `Researched ${job.company}`,
        time: formatTimeAgo(job.researched_at),
      },
    }),
  );

  return [...runs, ...research]
    .filter(({ timestamp }) => !Number.isNaN(timestamp))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map(({ entry }) => entry);
}
