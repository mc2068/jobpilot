import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import {
  RESUME_BUCKET,
  RESUME_GENERATION_ERROR,
  RESUME_INCOMPLETE_PROFILE_ERROR,
  RESUME_MIME_TYPE,
  getResumeKey,
} from "@/lib/resume";
import { renderResumePdf } from "@/lib/resume-document";
import { generateResumeContent } from "@/lib/resume-generation";
import { PROFILE_PATH } from "@/lib/routes";
import type { ActionResult, Profile } from "@/types";

type GenerateResponse = NextResponse<ActionResult>;

// The request has no body: the resume is built from the saved profile row.
export async function POST(): Promise<GenerateResponse> {
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

    const { data, error: readError } = await insforge.database
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (readError || !data) {
      console.error("[resume/generate] read", readError);
      return NextResponse.json(
        { success: false, error: RESUME_GENERATION_ERROR },
        { status: 500 },
      );
    }

    const profile: Profile = data;

    if (getProfileCompletion(profile).percent < 100) {
      return NextResponse.json(
        { success: false, error: RESUME_INCOMPLETE_PROFILE_ERROR },
        { status: 422 },
      );
    }

    const generated = await generateResumeContent(profile);

    if (!generated.success) {
      return NextResponse.json(
        { success: false, error: generated.error },
        { status: 502 },
      );
    }

    const buffer = await renderResumePdf(profile, generated.content);

    // Same key as an uploaded resume, so this replaces it
    const { data: uploaded, error: uploadError } = await insforge.storage
      .from(RESUME_BUCKET)
      .upload(
        getResumeKey(user.id),
        new Blob([new Uint8Array(buffer)], { type: RESUME_MIME_TYPE }),
      );

    if (uploadError || !uploaded) {
      console.error("[resume/generate] upload", uploadError);
      return NextResponse.json(
        { success: false, error: RESUME_GENERATION_ERROR },
        { status: 500 },
      );
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploaded.url })
      .eq("id", user.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("[resume/generate] update", updateError);
      return NextResponse.json(
        { success: false, error: RESUME_GENERATION_ERROR },
        { status: 500 },
      );
    }

    revalidatePath(PROFILE_PATH);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resume/generate]", error);
    return NextResponse.json(
      { success: false, error: RESUME_GENERATION_ERROR },
      { status: 500 },
    );
  }
}
