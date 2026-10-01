import { z } from "zod";

import { runHogQLQuery } from "@/lib/posthog-query";
import type { ChartPoint, ChartSeries } from "@/types";

export const JOBS_CHART_DAYS = 30;
export const RESEARCH_CHART_DAYS = 7;
// One x label every five days on the 30-day chart, so they do not collide
export const JOBS_CHART_LABEL_EVERY = 5;

const SCORE_BUCKETS = [
  { label: "50-60%", min: 50 },
  { label: "60-70%", min: 60 },
  { label: "70-80%", min: 70 },
  { label: "80-90%", min: 80 },
  { label: "90-100%", min: 90 },
];

const TICK_STEPS = [1, 2, 2.5, 3, 4, 5, 10];
const TICK_INTERVALS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

type LabelStyle = "date" | "weekday";

const LABEL_FORMATS: Record<LabelStyle, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }),
  weekday: new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }),
};

// PostHog can send a count as a JSON number or as a string
const countSchema = z
  .union([z.number(), z.string().min(1)])
  .transform(Number)
  .pipe(z.number().int().nonnegative());

const dailyRowsSchema = z.array(
  z.tuple([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), countSchema]),
);

// A null score is an event sent without a matchScore
const scoreRowsSchema = z.array(z.tuple([z.number().nullable(), countSchema]));

type DailyRow = z.infer<typeof dailyRowsSchema>[number];
type ScoreRow = z.infer<typeof scoreRowsSchema>[number];

// Days are UTC calendar days. The query reaches one day further back than the
// chart, and buildDailySeries keeps only the days it shows.
function dailyCountsQuery(days: number): string {
  return `
    SELECT formatDateTime(toTimeZone(timestamp, 'UTC'), '%Y-%m-%d') AS day, count() AS total
    FROM events
    WHERE event = {event}
      AND distinct_id = {userId}
      AND timestamp >= now() - INTERVAL ${days + 1} DAY
    GROUP BY day
    ORDER BY day
    LIMIT ${days + 2}
  `;
}

const SCORE_COUNTS_QUERY = `
  SELECT toInt(properties.matchScore) AS score, count() AS total
  FROM events
  WHERE event = 'job_found'
    AND distinct_id = {userId}
    AND timestamp >= now() - INTERVAL ${JOBS_CHART_DAYS} DAY
  GROUP BY score
  LIMIT 200
`;

// Five y-axis labels from zero, in whole steps, the last at or above max
export function buildTicks(max: number): number[] {
  // Never under 1: a count axis has no half steps
  const rawStep = Math.max(max / TICK_INTERVALS, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    TICK_STEPS.map((factor) => factor * magnitude).find(
      (candidate) => Number.isInteger(candidate) && candidate >= rawStep,
    ) ?? 10 * magnitude;

  return Array.from({ length: TICK_INTERVALS + 1 }, (_, index) => index * step);
}

function toSeries(data: ChartPoint[]): ChartSeries {
  return {
    data,
    ticks: buildTicks(Math.max(...data.map((point) => point.value))),
    isEmpty: data.every((point) => point.value === 0),
  };
}

// One point per day, oldest first and ending today, zero where nothing happened
export function buildDailySeries(
  rows: DailyRow[],
  days: number,
  now: Date,
  labelStyle: LabelStyle,
): ChartSeries {
  const counts = new Map(rows);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const data = Array.from({ length: days }, (_, index) => {
    const date = new Date(today - (days - 1 - index) * DAY_MS);

    return {
      label: LABEL_FORMATS[labelStyle].format(date),
      value: counts.get(date.toISOString().slice(0, 10)) ?? 0,
    };
  });

  return toSeries(data);
}

// A score sits in the range that starts at or below it, so 60 is in 60-70 and
// 100 in 90-100. Scores under 50 are not shown.
export function buildScoreDistribution(rows: ScoreRow[]): ChartSeries {
  const data = SCORE_BUCKETS.map(({ label }) => ({ label, value: 0 }));

  for (const [score, total] of rows) {
    if (score === null) {
      continue;
    }

    const index = SCORE_BUCKETS.findLastIndex(({ min }) => score >= min);

    if (index >= 0) {
      data[index].value += total;
    }
  }

  return toSeries(data);
}

async function loadDailySeries(
  name: string,
  event: string,
  userId: string,
  days: number,
  labelStyle: LabelStyle,
): Promise<ChartSeries | null> {
  const rows = await runHogQLQuery(name, dailyCountsQuery(days), {
    event,
    userId,
  });
  const parsed = dailyRowsSchema.safeParse(rows);

  if (!parsed.success) {
    if (rows) {
      console.error("[lib/dashboard-analytics]", name, "unexpected rows");
    }
    return null;
  }

  return buildDailySeries(parsed.data, days, new Date(), labelStyle);
}

// Each loader answers null when PostHog could not be read. None of them throw,
// so the page can start them without awaiting.
export function loadJobsOverTime(userId: string): Promise<ChartSeries | null> {
  return loadDailySeries(
    "dashboard jobs found over time",
    "job_found",
    userId,
    JOBS_CHART_DAYS,
    "date",
  );
}

export function loadResearchActivity(
  userId: string,
): Promise<ChartSeries | null> {
  return loadDailySeries(
    "dashboard company research activity",
    "company_researched",
    userId,
    RESEARCH_CHART_DAYS,
    "weekday",
  );
}

export async function loadScoreDistribution(
  userId: string,
): Promise<ChartSeries | null> {
  const name = "dashboard match score distribution";
  const rows = await runHogQLQuery(name, SCORE_COUNTS_QUERY, { userId });
  const parsed = scoreRowsSchema.safeParse(rows);

  if (!parsed.success) {
    if (rows) {
      console.error("[lib/dashboard-analytics]", name, "unexpected rows");
    }
    return null;
  }

  return buildScoreDistribution(parsed.data);
}
