import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { AI_MODEL, createAnthropic } from "@/lib/anthropic";
import { PROFILE_LIMITS, isHttpUrl } from "@/lib/profile-schema";
import {
  RESUME_EXTRACTION_ERROR,
  RESUME_UNREADABLE_ERROR,
} from "@/lib/resume";
import {
  DEGREES,
  EXPERIENCE_LEVELS,
  MAX_WORK_EXPERIENCE_ROLES,
  REMOTE_PREFERENCES,
  WORK_AUTHORIZATIONS,
  type ProfileFormValues,
} from "@/types";

type ExtractionResult =
  | { success: true; values: ProfileFormValues }
  | { success: false; error: string };

// Three roles with full responsibilities need far more than a short answer
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.3;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_PATTERN = /^\d{4}$/;
const MAX_YEARS_EXPERIENCE = 99;

// Plain strings throughout, with "" meaning "not stated". The API does not
// enforce enums, and it caps how many nullable fields one schema may have, so
// the dropdown values are matched in normalizeExtraction instead.
const extractionSchema = z.object({
  is_resume: z.boolean(),
  full_name: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin_url: z.string(),
  portfolio_url: z.string(),
  work_authorization: z.string(),
  current_title: z.string(),
  experience_level: z.string(),
  years_experience: z.number().nullable(),
  skills: z.array(z.string()),
  industries: z.array(z.string()),
  work_experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start_date: z.string(),
      end_date: z.string(),
      is_current: z.boolean(),
      responsibilities: z.string(),
    }),
  ),
  education: z.object({
    degree: z.string(),
    field_of_study: z.string(),
    institution: z.string(),
    graduation_year: z.string(),
  }),
  job_titles_seeking: z.array(z.string()),
  remote_preference: z.string(),
  salary_expectation: z.string(),
  preferred_locations: z.array(z.string()),
});

export type ResumeExtraction = z.infer<typeof extractionSchema>;

const listChoices = (choices: readonly string[]): string => choices.join(", ");

const SYSTEM_PROMPT = `You read a resume PDF and fill in a job seeker's profile form.

Only report what the resume states. Use an empty string or an empty list for anything it does not state, and null for years_experience. Never invent a value.

Field rules:
- is_resume: false when the document is not a resume or CV, or has no readable content.
- location: the candidate's own city and country or state, as written.
- linkedin_url, portfolio_url: full links starting with https://. portfolio_url is a personal site or GitHub profile.
- work_authorization (one of: ${listChoices(WORK_AUTHORIZATIONS)}), remote_preference (one of: ${listChoices(REMOTE_PREFERENCES)}), salary_expectation, preferred_locations: only when the resume says so explicitly. These are usually absent.
- current_title: the title of the current or most recent role.
- years_experience: whole years of professional work, counted from the work history up to today's date.
- experience_level (one of: ${listChoices(EXPERIENCE_LEVELS)}): junior for under 2 years, mid for 2 to 5, senior for more than 5, lead when the current title is a lead, principal, head or management role.
- skills: individual tools, languages and technologies, one per item, most relevant first, at most 30.
- industries: sectors the candidate has worked in, such as FinTech or Healthcare. Empty when unclear.
- work_experience: the ${MAX_WORK_EXPERIENCE_ROLES} most recent roles, newest first. Dates as YYYY-MM; when only a year is given use January of that year. For a current role set is_current to true and leave end_date empty. responsibilities is plain text, one accomplishment per line, taken from the resume, at most 600 characters.
- education: the highest degree only. degree is the closest of: ${listChoices(DEGREES)}. Use Other when none fits. graduation_year as YYYY.
- job_titles_seeking: target roles the resume names in a headline, objective or summary. When it names none, use the current title.`;

function cleanText(value: string, max: number): string | null {
  const text = value.trim().slice(0, max);
  return text === "" ? null : text;
}

function cleanUrl(value: string): string | null {
  const text = value.trim();

  if (text === "") {
    return null;
  }

  // Resumes often print links without the protocol
  const url = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  return url.length <= PROFILE_LIMITS.url && isHttpUrl(url) ? url : null;
}

function cleanTags(values: string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const value of values) {
    const tag = value.trim();
    const key = tag.toLowerCase();

    if (tag === "" || tag.length > PROFILE_LIMITS.tagLength || seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(tag);
  }

  return tags.slice(0, PROFILE_LIMITS.tagCount);
}

function cleanMonth(value: string): string {
  const month = value.trim();
  return MONTH_PATTERN.test(month) ? month : "";
}

function cleanYears(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  const years = Math.round(value);
  return years >= 0 && years <= MAX_YEARS_EXPERIENCE ? years : null;
}

// The profile form keeps these two lists in one comma-separated input, so a
// comma inside an item ("New York, NY") would split it in two on save.
function cleanCommaListItems(values: string[]): string[] {
  return cleanTags(values.map((value) => value.replace(/\s*,\s*/g, " ")));
}

const choiceKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Tolerates case, spacing and apostrophe differences: "Bachelor's" and
// "permanent resident" both find their dropdown value.
function matchChoice<Choice extends string>(
  value: string,
  choices: readonly Choice[],
): Choice | null {
  const key = choiceKey(value);
  return choices.find((choice) => choiceKey(choice) === key) ?? null;
}

// The model's output is free text. This brings it inside the limits the
// profile form validates, so a filled-in form never fails on save.
export function normalizeExtraction(
  extraction: ResumeExtraction,
): ProfileFormValues {
  const graduationYear = extraction.education.graduation_year.trim();
  const education = {
    degree: matchChoice(extraction.education.degree, DEGREES) ?? "",
    field_of_study:
      cleanText(extraction.education.field_of_study, PROFILE_LIMITS.text) ?? "",
    institution:
      cleanText(extraction.education.institution, PROFILE_LIMITS.text) ?? "",
    graduation_year: YEAR_PATTERN.test(graduationYear) ? graduationYear : "",
  };

  return {
    full_name: cleanText(extraction.full_name, PROFILE_LIMITS.text),
    phone: cleanText(extraction.phone, PROFILE_LIMITS.phone),
    location: cleanText(extraction.location, PROFILE_LIMITS.text),
    linkedin_url: cleanUrl(extraction.linkedin_url),
    portfolio_url: cleanUrl(extraction.portfolio_url),
    work_authorization: matchChoice(
      extraction.work_authorization,
      WORK_AUTHORIZATIONS,
    ),
    current_title: cleanText(extraction.current_title, PROFILE_LIMITS.text),
    experience_level: matchChoice(
      extraction.experience_level,
      EXPERIENCE_LEVELS,
    ),
    years_experience: cleanYears(extraction.years_experience),
    skills: cleanTags(extraction.skills),
    industries: cleanTags(extraction.industries),
    work_experience: extraction.work_experience
      .map((role) => {
        const endDate = cleanMonth(role.end_date);

        return {
          company: cleanText(role.company, PROFILE_LIMITS.text) ?? "",
          title: cleanText(role.title, PROFILE_LIMITS.text) ?? "",
          start_date: cleanMonth(role.start_date),
          end_date: role.is_current || endDate === "" ? null : endDate,
          is_current: role.is_current,
          responsibilities:
            cleanText(role.responsibilities, PROFILE_LIMITS.responsibilities) ??
            "",
        };
      })
      .filter((role) => role.company !== "" || role.title !== "")
      .slice(0, MAX_WORK_EXPERIENCE_ROLES),
    education: Object.values(education).some(Boolean) ? education : null,
    job_titles_seeking: cleanCommaListItems(extraction.job_titles_seeking),
    remote_preference: matchChoice(
      extraction.remote_preference,
      REMOTE_PREFERENCES,
    ),
    salary_expectation: cleanText(
      extraction.salary_expectation,
      PROFILE_LIMITS.salary,
    ),
    preferred_locations: cleanCommaListItems(extraction.preferred_locations),
  };
}

function hasResumeContent(values: ProfileFormValues): boolean {
  return (
    values.full_name !== null ||
    values.skills.length > 0 ||
    values.work_experience.length > 0
  );
}

export async function extractProfileFromResume(
  pdf: Blob,
): Promise<ExtractionResult> {
  try {
    const data = Buffer.from(await pdf.arrayBuffer()).toString("base64");
    const today = new Date().toISOString().slice(0, 10);

    const response = await createAnthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data },
            },
            {
              type: "text",
              text: `Today's date is ${today}. Extract the profile fields from this resume.`,
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(extractionSchema) },
    });

    const extraction = response.parsed_output;

    if (response.stop_reason !== "end_turn" || !extraction) {
      console.error(
        "[lib/resume-extraction] incomplete response",
        response.stop_reason,
      );
      return { success: false, error: RESUME_EXTRACTION_ERROR };
    }

    const values = normalizeExtraction(extraction);

    if (!extraction.is_resume || !hasResumeContent(values)) {
      return { success: false, error: RESUME_UNREADABLE_ERROR };
    }

    return { success: true, values };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(
        "[lib/resume-extraction] API error",
        error.status,
        error.message,
      );
      return { success: false, error: RESUME_EXTRACTION_ERROR };
    }

    console.error("[lib/resume-extraction]", error);
    return { success: false, error: RESUME_EXTRACTION_ERROR };
  }
}
