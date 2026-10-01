import { revalidatePath } from "next/cache";
import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";

import { researchCompany, type ResearchJob } from "@/agent/research";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { isBrowserbaseConfigured } from "@/lib/browserbase";
import { createInsforgeServer } from "@/lib/insforge-server";
import { isJobId } from "@/lib/job-details";
import { captureServerEvent } from "@/lib/posthog-server";
import {
  RESEARCH_ERROR,
  RESEARCH_JOB_ERROR,
  RESEARCH_UNAVAILABLE_ERROR,
} from "@/lib/research-messages";
import { getJobDetailsPath } from "@/lib/routes";
import type { ApiResult, Profile } from "@/types";

type ResearchResponse = NextResponse<ApiResult<{ researchedAt: string }>>;

// A homepage fetch, up to three page fetches in parallel and one Claude call.
// Normally about twenty seconds; this is the ceiling when pages are slow.
export const maxDuration = 90;

const JOB_COLUMNS =
  "id, company, title, about_role, matched_skills, missing_skills, source_url, external_apply_url";

const bodySchema = z.object({
  jobId: z.string().refine(isJobId),
});

async function readJobId(request: NextRequest): Promise<string | null> {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    return parsed.success ? parsed.data.jobId : null;
  } catch {
    // Not JSON: the same answer as a body that fails validation
    return null;
  }
}

export async function POST(request: NextRequest): Promise<ResearchResponse> {
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

    const jobId = await readJobId(request);

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: RESEARCH_JOB_ERROR },
        { status: 400 },
      );
    }

    // Checked before anything is loaded or fetched: without both services
    // there is nothing to build a dossier from.
    if (!isAnthropicConfigured() || !isBrowserbaseConfigured()) {
      console.error(
        "[agent/research] ANTHROPIC_API_KEY or BROWSERBASE_API_KEY is not set",
      );
      return NextResponse.json(
        { success: false, error: RESEARCH_UNAVAILABLE_ERROR },
        { status: 503 },
      );
    }

    const [jobResult, profileResult] = await Promise.all([
      insforge.database
        .from("jobs")
        .select(JOB_COLUMNS)
        .eq("id", jobId)
        .eq("user_id", user.id)
        .limit(1),
      insforge.database
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single(),
    ]);

    if (jobResult.error || !jobResult.data) {
      console.error("[agent/research] job", jobResult.error);
      return NextResponse.json(
        { success: false, error: RESEARCH_ERROR },
        { status: 500 },
      );
    }

    const jobs: ResearchJob[] = jobResult.data;

    // A job that does not exist, or belongs to someone else
    if (jobs.length === 0) {
      return NextResponse.json(
        { success: false, error: RESEARCH_JOB_ERROR },
        { status: 404 },
      );
    }

    if (profileResult.error || !profileResult.data) {
      console.error("[agent/research] profile", profileResult.error);
      return NextResponse.json(
        { success: false, error: RESEARCH_ERROR },
        { status: 500 },
      );
    }

    const job = jobs[0];
    const profile: Profile = profileResult.data;

    const result = await researchCompany(insforge, {
      userId: user.id,
      job,
      profile,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: RESEARCH_ERROR },
        { status: 502 },
      );
    }

    // Row level security turns a blocked write into zero rows without an
    // error: .select().single() makes that fail here.
    const { error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: result.dossier })
      .eq("id", job.id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("[agent/research] save", updateError);
      return NextResponse.json(
        { success: false, error: RESEARCH_ERROR },
        { status: 500 },
      );
    }

    after(() =>
      captureServerEvent(user.id, "company_researched", {
        jobId: job.id,
        company: job.company,
      }),
    );

    revalidatePath(getJobDetailsPath(job.id));
    return NextResponse.json({
      success: true,
      data: { researchedAt: result.dossier.researchedAt },
    });
  } catch (error) {
    console.error("[agent/research]", error);
    return NextResponse.json(
      { success: false, error: RESEARCH_ERROR },
      { status: 500 },
    );
  }
}
