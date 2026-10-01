import { revalidatePath } from "next/cache";
import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";

import { discoverJobs } from "@/agent/adzuna";
import { isAdzunaConfigured } from "@/lib/adzuna";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { createInsforgeServer } from "@/lib/insforge-server";
import {
  JOB_SEARCH_ERROR,
  JOB_SEARCH_LIMITS,
  JOB_SEARCH_PROFILE_ERROR,
  JOB_SEARCH_TITLE_ERROR,
  JOB_SEARCH_UNAVAILABLE_ERROR,
  canSearchJobs,
} from "@/lib/job-search";
import { captureServerEvent } from "@/lib/posthog-server";
import { FIND_JOBS_PATH } from "@/lib/routes";
import type { ApiResult, JobSearchResult, Profile } from "@/types";

type FindResponse = NextResponse<ApiResult<JobSearchResult>>;

// Up to ten scoring calls run at once and each can take a while
export const maxDuration = 60;

const searchSchema = z.object({
  jobTitle: z.string().trim().min(1).max(JOB_SEARCH_LIMITS.jobTitle),
  location: z.string().trim().max(JOB_SEARCH_LIMITS.location).default(""),
});

async function readSearch(
  request: NextRequest,
): Promise<z.infer<typeof searchSchema> | null> {
  try {
    const parsed = searchSchema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    // Not JSON: the same answer as a body that fails validation
    return null;
  }
}

export async function POST(request: NextRequest): Promise<FindResponse> {
  try {
    const insforge = await createInsforgeServer();
    const { data: auth, error: authError } =
      await insforge.auth.getCurrentUser();
    const user = auth?.user;

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const search = await readSearch(request);

    if (!search) {
      return NextResponse.json(
        { success: false, error: JOB_SEARCH_TITLE_ERROR },
        { status: 400 },
      );
    }

    const { jobTitle, location } = search;

    // Checked before a run is created or Adzuna is called: without both
    // services nothing could be saved.
    if (!isAdzunaConfigured() || !isAnthropicConfigured()) {
      console.error(
        "[agent/find] ADZUNA_APP_ID, ADZUNA_APP_KEY or ANTHROPIC_API_KEY is not set",
      );
      return NextResponse.json(
        { success: false, error: JOB_SEARCH_UNAVAILABLE_ERROR },
        { status: 503 },
      );
    }

    const { data: profileRow, error: profileError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profileRow) {
      console.error("[agent/find] profile", profileError);
      return NextResponse.json(
        { success: false, error: JOB_SEARCH_ERROR },
        { status: 500 },
      );
    }

    const profile: Profile = profileRow;

    if (!canSearchJobs(profile)) {
      return NextResponse.json(
        { success: false, error: JOB_SEARCH_PROFILE_ERROR },
        { status: 422 },
      );
    }

    const { data: run, error: runError } = await insforge.database
      .from("agent_runs")
      .insert([
        {
          user_id: user.id,
          job_title_searched: jobTitle,
          location_searched: location || null,
        },
      ])
      .select("id")
      .single();

    if (runError || !run) {
      console.error("[agent/find] run", runError);
      return NextResponse.json(
        { success: false, error: JOB_SEARCH_ERROR },
        { status: 500 },
      );
    }

    after(() =>
      captureServerEvent(user.id, "job_search_started", { jobTitle, location }),
    );

    const result = await discoverJobs(insforge, {
      userId: user.id,
      runId: run.id,
      profile,
      jobTitle,
      location,
    });

    const found = result.success ? result.matchScores.length : 0;

    const { error: updateError } = await insforge.database
      .from("agent_runs")
      .update({
        status: result.success ? "completed" : "failed",
        jobs_found: found,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (updateError) {
      // The jobs are already saved, so the search itself still succeeded
      console.error("[agent/find] run update", updateError);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 },
      );
    }

    after(async () => {
      await Promise.all(
        result.matchScores.map((matchScore) =>
          captureServerEvent(user.id, "job_found", {
            source: "search",
            matchScore,
          }),
        ),
      );
    });

    revalidatePath(FIND_JOBS_PATH);
    return NextResponse.json({
      success: true,
      data: { found, strongMatches: result.strongMatches },
    });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json(
      { success: false, error: JOB_SEARCH_ERROR },
      { status: 500 },
    );
  }
}
