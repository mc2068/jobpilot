"use client";

import { useRef, useState, useTransition } from "react";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { getProfileCompletion } from "@/lib/profile-completion";
import { fillEmptyProfileFields } from "@/lib/profile-merge";
import { parseProfileForm } from "@/lib/profile-schema";
import { RESUME_EXTRACTION_ERROR } from "@/lib/resume";
import { RESUME_EXTRACT_API_PATH } from "@/lib/routes";
import type {
  ApiResult,
  Profile,
  ProfileFormValues,
  ResultNotice,
} from "@/types";

type Props = {
  profile: Profile;
};

export function ProfileWorkspace({ profile }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formProfile, setFormProfile] = useState(profile);
  // Bumping this remounts the form, which is how uncontrolled fields pick up
  // the extracted values.
  const [formVersion, setFormVersion] = useState(0);
  const [notice, setNotice] = useState<ResultNotice | null>(null);
  const [isExtracting, startExtracting] = useTransition();

  // What is on screen now, unsaved edits included
  const readForm = (): ProfileFormValues | null => {
    if (!formRef.current) {
      return null;
    }

    const parsed = parseProfileForm(new FormData(formRef.current));

    if (!parsed.success) {
      setNotice({
        success: false,
        message: `${parsed.error} Fix that field before extracting.`,
      });
      return null;
    }

    return parsed.values;
  };

  const handleExtract = () => {
    // Checked before spending an AI call: the merge below needs a valid form
    if (!readForm()) {
      return;
    }

    setNotice(null);

    startExtracting(async () => {
      try {
        const response = await fetch(RESUME_EXTRACT_API_PATH, {
          method: "POST",
        });
        const result: ApiResult<ProfileFormValues> = await response.json();

        if (!result.success || !result.data) {
          setNotice({
            success: false,
            message: result.error ?? RESUME_EXTRACTION_ERROR,
          });
          return;
        }

        // Read again: the form stays editable while the request is running
        const current = readForm();

        if (!current) {
          return;
        }

        const { values, filledCount } = fillEmptyProfileFields(
          current,
          result.data,
        );

        if (filledCount === 0) {
          setNotice({
            success: true,
            message:
              "Your resume had nothing to add: every field it covers is already filled.",
          });
          return;
        }

        setFormProfile({ ...profile, ...values });
        setFormVersion((version) => version + 1);
        setNotice({
          success: true,
          message: `Filled ${filledCount} empty ${
            filledCount === 1 ? "field" : "fields"
          } from your resume. Review them, then save your profile.`,
        });
      } catch (error) {
        console.error("[profile/ProfileWorkspace]", error);
        setNotice({ success: false, message: RESUME_EXTRACTION_ERROR });
      }
    });
  };

  return (
    <>
      <ResumeUpload
        hasResume={Boolean(profile.resume_pdf_url)}
        // The saved row, not the form: that is what a resume is generated from
        isProfileComplete={getProfileCompletion(profile).percent === 100}
        isExtracting={isExtracting}
        onExtract={handleExtract}
      />
      <ProfileForm
        key={formVersion}
        ref={formRef}
        profile={formProfile}
        notice={notice}
      />
    </>
  );
}
