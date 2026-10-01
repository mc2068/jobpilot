import { z } from "zod";

import {
  EXPERIENCE_LEVELS,
  MAX_WORK_EXPERIENCE_ROLES,
  REMOTE_PREFERENCES,
  WORK_AUTHORIZATIONS,
  type ProfileFormValues,
} from "@/types";

type ParseResult =
  | { success: true; values: ProfileFormValues }
  | { success: false; error: string };

const GENERIC_ERROR =
  "Some fields aren’t valid. Please check them and try again.";
const MONTH_PATTERN = /^(\d{4}-(0[1-9]|1[0-2]))?$/;

// Shared with lib/resume-extraction.ts so extracted values always pass a save.
export const PROFILE_LIMITS = {
  text: 200,
  phone: 40,
  salary: 100,
  url: 300,
  degree: 100,
  responsibilities: 2000,
  tagLength: 60,
  tagCount: 50,
} as const;

const ROLE_INDEXES = Array.from(
  { length: MAX_WORK_EXPERIENCE_ROLES },
  (_, index) => index,
);

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const emptyToNull = (value: string): string | null =>
  value === "" ? null : value;

const optionalText = (label: string, max: number = PROFILE_LIMITS.text) =>
  z
    .string()
    .trim()
    .max(max, `${label} is too long.`)
    .transform(emptyToNull);

const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(PROFILE_LIMITS.url, `${label} is too long.`)
    .refine(
      (value) => value === "" || isHttpUrl(value),
      `${label} must be a full link starting with https://.`,
    )
    .transform(emptyToNull);

const optionalChoice = <Value extends string>(
  label: string,
  values: readonly [Value, ...Value[]],
) =>
  z
    .union([z.literal(""), z.enum(values)], `Choose a valid ${label}.`)
    .transform((value) => (value === "" ? null : value));

const tagList = (label: string) =>
  z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(PROFILE_LIMITS.tagLength, `One of the ${label} is too long.`),
    )
    .max(PROFILE_LIMITS.tagCount, `There are too many ${label}.`);

const month = (label: string) =>
  z.string().regex(MONTH_PATTERN, `${label} must be a month and year.`);

const roleSchema = z.object({
  company: z
    .string()
    .trim()
    .max(PROFILE_LIMITS.text, "Company name is too long."),
  title: z.string().trim().max(PROFILE_LIMITS.text, "Job title is too long."),
  start_date: month("Start date"),
  end_date: month("End date"),
  is_current: z.boolean(),
  responsibilities: z
    .string()
    .trim()
    .max(PROFILE_LIMITS.responsibilities, "Key responsibilities are too long."),
});

const profileSchema = z.object({
  full_name: optionalText("Full name"),
  phone: optionalText("Phone number", PROFILE_LIMITS.phone),
  location: optionalText("Location"),
  linkedin_url: optionalUrl("LinkedIn URL"),
  portfolio_url: optionalUrl("Portfolio / GitHub"),
  work_authorization: optionalChoice("work authorization", WORK_AUTHORIZATIONS),
  current_title: optionalText("Job title"),
  experience_level: optionalChoice("experience level", EXPERIENCE_LEVELS),
  years_experience: z
    .string()
    .trim()
    .regex(/^\d{0,2}$/, "Years of experience must be a whole number.")
    .transform((value) => (value === "" ? null : Number(value))),
  skills: tagList("skills"),
  industries: tagList("industries"),
  work_experience: z.array(roleSchema),
  education: z.object({
    degree: z.string().trim().max(PROFILE_LIMITS.degree, "Degree is too long."),
    field_of_study: z
      .string()
      .trim()
      .max(PROFILE_LIMITS.text, "Field of study is too long."),
    institution: z
      .string()
      .trim()
      .max(PROFILE_LIMITS.text, "Institution name is too long."),
    graduation_year: z
      .string()
      .trim()
      .regex(/^(\d{4})?$/, "Graduation year must be four digits."),
  }),
  job_titles_seeking: tagList("job titles"),
  remote_preference: optionalChoice("remote preference", REMOTE_PREFERENCES),
  salary_expectation: optionalText("Salary expectation", PROFILE_LIMITS.salary),
  preferred_locations: tagList("preferred locations"),
});

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string");
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Field names are the ones components/profile/ProfileForm.tsx renders.
export function parseProfileForm(formData: FormData): ParseResult {
  const parsed = profileSchema.safeParse({
    full_name: readText(formData, "full_name"),
    phone: readText(formData, "phone"),
    location: readText(formData, "location"),
    linkedin_url: readText(formData, "linkedin_url"),
    portfolio_url: readText(formData, "portfolio_url"),
    work_authorization: readText(formData, "work_authorization"),
    current_title: readText(formData, "current_title"),
    experience_level: readText(formData, "experience_level"),
    years_experience: readText(formData, "years_experience"),
    skills: readList(formData, "skills"),
    industries: readList(formData, "industries"),
    work_experience: ROLE_INDEXES.map((index) => {
      const prefix = `work_experience.${index}`;
      return {
        company: readText(formData, `${prefix}.company`),
        title: readText(formData, `${prefix}.title`),
        start_date: readText(formData, `${prefix}.start_date`),
        end_date: readText(formData, `${prefix}.end_date`),
        // An unchecked checkbox is simply absent from the form data
        is_current: formData.has(`${prefix}.is_current`),
        responsibilities: readText(formData, `${prefix}.responsibilities`),
      };
    }),
    education: {
      degree: readText(formData, "education.degree"),
      field_of_study: readText(formData, "education.field_of_study"),
      institution: readText(formData, "education.institution"),
      graduation_year: readText(formData, "education.graduation_year"),
    },
    job_titles_seeking: splitCommaList(readText(formData, "job_titles_seeking")),
    remote_preference: readText(formData, "remote_preference"),
    salary_expectation: readText(formData, "salary_expectation"),
    preferred_locations: splitCommaList(
      readText(formData, "preferred_locations"),
    ),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? GENERIC_ERROR,
    };
  }

  const { education, work_experience, ...fields } = parsed.data;
  const hasEducation = Object.values(education).some(Boolean);

  return {
    success: true,
    values: {
      ...fields,
      education: hasEducation ? education : null,
      work_experience: work_experience
        .filter(
          (role) =>
            role.company ||
            role.title ||
            role.start_date ||
            role.end_date ||
            role.responsibilities,
        )
        .map((role) => ({
          ...role,
          end_date: role.is_current || !role.end_date ? null : role.end_date,
        })),
    },
  };
}
