import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import {
  RESUME_BUCKET,
  RESUME_EXTRACTION_ERROR,
  getResumeKey,
} from "@/lib/resume";
import { extractProfileFromResume } from "@/lib/resume-extraction";
import type { ApiResult, ProfileFormValues } from "@/types";

type ExtractResponse = NextResponse<ApiResult<ProfileFormValues>>;

// The request has no body: the resume is the signed-in user's stored file.
export async function POST(): Promise<ExtractResponse> {
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

    const { data: pdf, error: downloadError } = await insforge.storage
      .from(RESUME_BUCKET)
      .download(getResumeKey(user.id));

    if (downloadError || !pdf) {
      console.error("[resume/extract] download", downloadError);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn’t find your resume. Please upload it again.",
        },
        { status: 404 },
      );
    }

    const result = await extractProfileFromResume(pdf);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true, data: result.values });
  } catch (error) {
    console.error("[resume/extract]", error);
    return NextResponse.json(
      { success: false, error: RESUME_EXTRACTION_ERROR },
      { status: 500 },
    );
  }
}
