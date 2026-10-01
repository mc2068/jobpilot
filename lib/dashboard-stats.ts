import { z } from "zod";

import { MISSING_VALUE } from "@/lib/job-details";
import type { DashboardStat, StatTrend } from "@/types";

// The database function in migrations/20261001162018_dashboard-stats.sql
export const DASHBOARD_STATS_RPC = "get_dashboard_stats";

const TREND_NOTE = "vs last week";

// A Postgres numeric can arrive as a JSON number or as a string
const numericSchema = z
  .union([z.number(), z.string().min(1)])
  .transform(Number)
  .pipe(z.number());

const statsRowSchema = z.object({
  total_jobs: z.number(),
  avg_match_score: numericSchema.nullable(),
  companies_researched: z.number(),
  jobs_this_week: z.number(),
  avg_match_score_before_week: numericSchema.nullable(),
});

type StatsRow = z.infer<typeof statsRowSchema>;

function formatTrend(change: number): StatTrend {
  if (change > 0) {
    return { label: `+${change}%`, tone: "up" };
  }
  if (change < 0) {
    return { label: `${change}%`, tone: "down" };
  }
  return { label: "0%", tone: "flat" };
}

// Null when the function's answer is not the one row it should be
export function parseDashboardStats(data: unknown): StatsRow | null {
  const result = z.array(statsRowSchema).length(1).safeParse(data);
  return result.success ? result.data[0] : null;
}

// A trend needs a baseline from more than a week ago. Without one the card
// shows a plain note, never an invented percentage.
export function buildDashboardStats(row: StatsRow): DashboardStat[] {
  const totalBeforeWeek = row.total_jobs - row.jobs_this_week;
  const average =
    row.avg_match_score === null ? null : Math.round(row.avg_match_score);
  const averageBeforeWeek =
    row.avg_match_score_before_week === null
      ? null
      : Math.round(row.avg_match_score_before_week);

  const totalTrend =
    totalBeforeWeek > 0
      ? formatTrend(Math.round((row.jobs_this_week / totalBeforeWeek) * 100))
      : undefined;
  // The change in percentage points, as the design's "+3%"
  const averageTrend =
    average !== null && averageBeforeWeek !== null
      ? formatTrend(average - averageBeforeWeek)
      : undefined;

  return [
    {
      label: "Total Jobs Found",
      value: String(row.total_jobs),
      trend: totalTrend,
      note: totalTrend ? TREND_NOTE : "All time",
    },
    {
      label: "Avg. Match Rate",
      value: average === null ? MISSING_VALUE : `${average}%`,
      trend: averageTrend,
      note: averageTrend ? TREND_NOTE : "Across all jobs",
    },
    {
      label: "Companies Researched",
      value: String(row.companies_researched),
      note: "Total researched",
    },
    {
      label: "Jobs This Week",
      value: String(row.jobs_this_week),
      note: "New this week",
    },
  ];
}
