import type { ProfileCompletion, ProfileFormValues } from "@/types";

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

// The ten items the profile design counts. Each is worth the same share, and
// the labels are what the "Profile needs attention" banner shows as tags.
export function getProfileCompletion(
  profile: ProfileFormValues,
): ProfileCompletion {
  const { education } = profile;

  const checks = [
    { label: "Full Name", isDone: hasText(profile.full_name) },
    { label: "Phone", isDone: hasText(profile.phone) },
    { label: "Location", isDone: hasText(profile.location) },
    { label: "Job Title", isDone: hasText(profile.current_title) },
    { label: "Experience Level", isDone: profile.experience_level !== null },
    { label: "Years of Experience", isDone: profile.years_experience !== null },
    { label: "Skills", isDone: profile.skills.length > 0 },
    {
      label: "Work Experience",
      isDone: profile.work_experience.some(
        (role) => hasText(role.company) && hasText(role.title),
      ),
    },
    {
      label: "Education",
      isDone:
        hasText(education?.degree) &&
        hasText(education?.institution) &&
        hasText(education?.graduation_year),
    },
    { label: "Job Titles Seeking", isDone: profile.job_titles_seeking.length > 0 },
  ];

  const missingFields = checks
    .filter((check) => !check.isDone)
    .map((check) => check.label);
  const doneCount = checks.length - missingFields.length;

  return {
    percent: Math.round((doneCount / checks.length) * 100),
    missingFields,
  };
}
