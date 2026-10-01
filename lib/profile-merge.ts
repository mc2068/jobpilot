import type { Education, ProfileFormValues } from "@/types";

type MergeResult = {
  values: ProfileFormValues;
  filledCount: number;
};

const EMPTY_EDUCATION: Education = {
  degree: "",
  field_of_study: "",
  institution: "",
  graduation_year: "",
};

function isBlank(value: string | number | null): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

function isEmptyList(value: unknown[]): boolean {
  return value.length === 0;
}

// Extracted resume data only ever lands in fields the user has left empty.
// Work experience counts as one field: roles are never mixed with existing ones.
export function fillEmptyProfileFields(
  current: ProfileFormValues,
  extracted: ProfileFormValues,
): MergeResult {
  let filledCount = 0;

  const pick = <Value>(
    currentValue: Value,
    extractedValue: Value,
    isEmpty: (value: Value) => boolean,
  ): Value => {
    if (!isEmpty(currentValue) || isEmpty(extractedValue)) {
      return currentValue;
    }

    filledCount += 1;
    return extractedValue;
  };

  const currentEducation = current.education ?? EMPTY_EDUCATION;
  const extractedEducation = extracted.education ?? EMPTY_EDUCATION;

  const education: Education = {
    degree: pick(currentEducation.degree, extractedEducation.degree, isBlank),
    field_of_study: pick(
      currentEducation.field_of_study,
      extractedEducation.field_of_study,
      isBlank,
    ),
    institution: pick(
      currentEducation.institution,
      extractedEducation.institution,
      isBlank,
    ),
    graduation_year: pick(
      currentEducation.graduation_year,
      extractedEducation.graduation_year,
      isBlank,
    ),
  };

  const values: ProfileFormValues = {
    full_name: pick(current.full_name, extracted.full_name, isBlank),
    phone: pick(current.phone, extracted.phone, isBlank),
    location: pick(current.location, extracted.location, isBlank),
    linkedin_url: pick(current.linkedin_url, extracted.linkedin_url, isBlank),
    portfolio_url: pick(
      current.portfolio_url,
      extracted.portfolio_url,
      isBlank,
    ),
    work_authorization: pick(
      current.work_authorization,
      extracted.work_authorization,
      isBlank,
    ),
    current_title: pick(
      current.current_title,
      extracted.current_title,
      isBlank,
    ),
    experience_level: pick(
      current.experience_level,
      extracted.experience_level,
      isBlank,
    ),
    years_experience: pick(
      current.years_experience,
      extracted.years_experience,
      isBlank,
    ),
    skills: pick(current.skills, extracted.skills, isEmptyList),
    industries: pick(current.industries, extracted.industries, isEmptyList),
    work_experience: pick(
      current.work_experience,
      extracted.work_experience,
      isEmptyList,
    ),
    education: Object.values(education).some(Boolean) ? education : null,
    job_titles_seeking: pick(
      current.job_titles_seeking,
      extracted.job_titles_seeking,
      isEmptyList,
    ),
    remote_preference: pick(
      current.remote_preference,
      extracted.remote_preference,
      isBlank,
    ),
    salary_expectation: pick(
      current.salary_expectation,
      extracted.salary_expectation,
      isBlank,
    ),
    preferred_locations: pick(
      current.preferred_locations,
      extracted.preferred_locations,
      isEmptyList,
    ),
  };

  return { values, filledCount };
}
