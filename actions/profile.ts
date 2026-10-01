"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { captureServerEvent } from "@/lib/posthog-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { parseProfileForm } from "@/lib/profile-schema";
import {
  RESUME_BUCKET,
  RESUME_MAX_SIZE_BYTES,
  RESUME_MAX_SIZE_MB,
  RESUME_MIME_TYPE,
  getResumeKey,
} from "@/lib/resume";
import { PROFILE_PATH } from "@/lib/routes";
import type { ActionResult } from "@/types";

const SIGNED_OUT_ERROR = "Your session has expired. Please sign in again.";
const SAVE_ERROR = "We couldn’t save your profile. Please try again.";
const UPLOAD_ERROR = "We couldn’t upload your resume. Please try again.";
const PDF_SIGNATURE = "%PDF-";

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: auth, error: authError } =
      await insforge.auth.getCurrentUser();
    const user = auth?.user;

    if (authError || !user) {
      return { success: false, error: SIGNED_OUT_ERROR };
    }

    const parsed = parseProfileForm(formData);

    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }

    const { data: current, error: readError } = await insforge.database
      .from("profiles")
      .select("is_complete")
      .eq("id", user.id)
      .single();

    if (readError || !current) {
      console.error("[actions/profile] saveProfile read", readError);
      return { success: false, error: SAVE_ERROR };
    }

    const isComplete = getProfileCompletion(parsed.values).percent === 100;

    // Row level security turns a write to someone else's row into "no rows",
    // not an error, so ask for the row back to know the update landed.
    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ ...parsed.values, is_complete: isComplete })
      .eq("id", user.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("[actions/profile] saveProfile update", updateError);
      return { success: false, error: SAVE_ERROR };
    }

    if (isComplete && !current.is_complete) {
      after(() => captureServerEvent(user.id, "profile_completed"));
    }

    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (error) {
    console.error("[actions/profile] saveProfile", error);
    return { success: false, error: SAVE_ERROR };
  }
}

export async function uploadResume(formData: FormData): Promise<ActionResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: auth, error: authError } =
      await insforge.auth.getCurrentUser();
    const user = auth?.user;

    if (authError || !user) {
      return { success: false, error: SIGNED_OUT_ERROR };
    }

    const file = formData.get("resume");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a PDF resume." };
    }

    if (file.size > RESUME_MAX_SIZE_BYTES) {
      return {
        success: false,
        error: `That file is larger than ${RESUME_MAX_SIZE_MB}MB.`,
      };
    }

    // The browser-reported type can be anything, so check the file itself too
    const signature = await file.slice(0, PDF_SIGNATURE.length).text();

    if (file.type !== RESUME_MIME_TYPE || signature !== PDF_SIGNATURE) {
      return {
        success: false,
        error: "That file isn’t a PDF. Please choose a PDF resume.",
      };
    }

    const { data: uploaded, error: uploadError } = await insforge.storage
      .from(RESUME_BUCKET)
      .upload(getResumeKey(user.id), file);

    if (uploadError || !uploaded) {
      console.error("[actions/profile] uploadResume upload", uploadError);
      return { success: false, error: UPLOAD_ERROR };
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploaded.url })
      .eq("id", user.id)
      .select("id")
      .single();

    if (updateError) {
      console.error("[actions/profile] uploadResume update", updateError);
      return { success: false, error: UPLOAD_ERROR };
    }

    revalidatePath(PROFILE_PATH);
    return { success: true };
  } catch (error) {
    console.error("[actions/profile] uploadResume", error);
    return { success: false, error: UPLOAD_ERROR };
  }
}
