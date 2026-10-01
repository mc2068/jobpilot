import { NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { RESUME_BUCKET, RESUME_MIME_TYPE, getResumeKey } from "@/lib/resume";
import type { ActionResult } from "@/types";

const LOAD_ERROR = "We couldn’t open your resume. Please try again.";

// Serves the signed-in user's stored resume. The bucket is private, so this
// is the only way a browser can open the file. Success returns the PDF itself,
// not the JSON wrapper.
export async function GET(): Promise<NextResponse<Blob | ActionResult>> {
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
      console.error("[resume] download", downloadError);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn’t find your resume. Please upload it again.",
        },
        { status: 404 },
      );
    }

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": RESUME_MIME_TYPE,
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[resume]", error);
    return NextResponse.json(
      { success: false, error: LOAD_ERROR },
      { status: 500 },
    );
  }
}
