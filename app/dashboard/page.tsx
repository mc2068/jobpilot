import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { ChartSlot } from "@/components/dashboard/ChartSlot";
import { DashboardAreaChart } from "@/components/dashboard/DashboardAreaChart";
import { DashboardBarChart } from "@/components/dashboard/DashboardBarChart";
import { ProfileBanner } from "@/components/dashboard/ProfileBanner";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { Navbar } from "@/components/layout/Navbar";
import {
  ACTIVITY_RESEARCH_COLUMNS,
  ACTIVITY_RUN_COLUMNS,
  RECENT_ACTIVITY_LIMIT,
  RESEARCHED_AT_PATH,
  buildRecentActivity,
} from "@/lib/dashboard-activity";
import {
  JOBS_CHART_LABEL_EVERY,
  loadJobsOverTime,
  loadResearchActivity,
  loadScoreDistribution,
} from "@/lib/dashboard-analytics";
import {
  DASHBOARD_STATS_RPC,
  buildDashboardStats,
  parseDashboardStats,
} from "@/lib/dashboard-stats";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { LOGIN_PATH } from "@/lib/routes";
import type { ActivityEntry, ChartSeries, DashboardStat } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard · JobPilot",
};

type DashboardData = {
  // Null when the profile is complete, or could not be read
  profilePercent: number | null;
  // Null when the stats could not be read
  stats: DashboardStat[] | null;
  // Null when the activity could not be read
  activity: ActivityEntry[] | null;
  // Still loading when the page renders: each one resolves to null when
  // PostHog could not be read
  charts: {
    research: Promise<ChartSeries | null>;
    jobsOverTime: Promise<ChartSeries | null>;
    scores: Promise<ChartSeries | null>;
  };
};

async function loadDashboard(): Promise<DashboardData> {
  const insforge = await createInsforgeServer();
  const { data: auth, error: authError } = await insforge.auth.getCurrentUser();
  const user = auth?.user;

  if (authError || !user) {
    redirect(LOGIN_PATH);
  }

  // Not awaited: the charts stream in after the rest of the page
  const charts = {
    research: loadResearchActivity(user.id),
    jobsOverTime: loadJobsOverTime(user.id),
    scores: loadScoreDistribution(user.id),
  };

  const [profileResult, statsResult, runsResult, researchResult] =
    await Promise.all([
      insforge.database.from("profiles").select("*").eq("id", user.id).single(),
      // Scoped to the signed-in user inside the function (auth.uid())
      insforge.database.rpc(DASHBOARD_STATS_RPC),
      insforge.database
        .from("agent_runs")
        .select(ACTIVITY_RUN_COLUMNS)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(RECENT_ACTIVITY_LIMIT),
      insforge.database
        .from("jobs")
        .select(ACTIVITY_RESEARCH_COLUMNS)
        .eq("user_id", user.id)
        .not(RESEARCHED_AT_PATH, "is", null)
        .order(RESEARCHED_AT_PATH, { ascending: false })
        .limit(RECENT_ACTIVITY_LIMIT),
    ]);

  if (profileResult.error || !profileResult.data) {
    console.error("[dashboard/page] profile", profileResult.error);
  }

  const statsRow = statsResult.error
    ? null
    : parseDashboardStats(statsResult.data);

  if (!statsRow) {
    console.error("[dashboard/page] stats", statsResult.error);
  }

  if (runsResult.error || researchResult.error) {
    console.error(
      "[dashboard/page] activity",
      runsResult.error ?? researchResult.error,
    );
  }

  const percent = profileResult.data
    ? getProfileCompletion(profileResult.data).percent
    : 100;

  return {
    profilePercent: percent < 100 ? percent : null,
    stats: statsRow ? buildDashboardStats(statsRow) : null,
    activity:
      runsResult.error || researchResult.error
        ? null
        : buildRecentActivity(runsResult.data, researchResult.data),
    charts,
  };
}

export default async function DashboardPage() {
  const { profilePercent, stats, activity, charts } = await loadDashboard();

  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1332px] flex-col gap-6">
          {profilePercent !== null && <ProfileBanner percent={profilePercent} />}

          {stats ? (
            <StatsBar stats={stats} />
          ) : (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-border bg-surface p-6 text-sm text-text-dark shadow-sm"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
              We couldn’t load your stats. Please refresh the page or sign in
              again.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentActivity entries={activity} />
            <ChartCard title="Company Research Activity">
              <Suspense fallback={<ChartPlaceholder state="loading" />}>
                <ChartSlot
                  series={charts.research}
                  emptyMessage="No company research in the last 7 days."
                >
                  {({ data, ticks }) => (
                    <DashboardBarChart
                      data={data}
                      ticks={ticks}
                      tone="info"
                      barSize={40}
                    />
                  )}
                </ChartSlot>
              </Suspense>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <ChartCard title="Jobs Found Over Time" className="lg:col-span-8">
              <Suspense fallback={<ChartPlaceholder state="loading" />}>
                <ChartSlot
                  series={charts.jobsOverTime}
                  emptyMessage="No jobs found in the last 30 days. Run a search to see them here."
                >
                  {({ data, ticks }) => (
                    <DashboardAreaChart
                      data={data}
                      ticks={ticks}
                      labelEvery={JOBS_CHART_LABEL_EVERY}
                    />
                  )}
                </ChartSlot>
              </Suspense>
            </ChartCard>
            <ChartCard
              title="Match Score Distribution"
              className="lg:col-span-4"
            >
              <Suspense fallback={<ChartPlaceholder state="loading" />}>
                <ChartSlot
                  series={charts.scores}
                  emptyMessage="No jobs scored 50% or more in the last 30 days."
                >
                  {({ data, ticks }) => (
                    <DashboardBarChart
                      data={data}
                      ticks={ticks}
                      tone="success"
                      barSize={32}
                    />
                  )}
                </ChartSlot>
              </Suspense>
            </ChartCard>
          </div>
        </div>
      </main>
    </>
  );
}
