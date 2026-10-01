import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { AI_MODEL, createAnthropic } from "@/lib/anthropic";
import { RESUME_GENERATION_ERROR } from "@/lib/resume";
import {
  MAX_WORK_EXPERIENCE_ROLES,
  type Profile,
  type WorkExperience,
} from "@/types";

// The prose Claude writes. Every fact on the resume comes from the profile.
export type ResumeContent = {
  summary: string;
  // One list of bullets per role, in the order of getResumeRoles(profile)
  roleBullets: string[][];
};

type GenerationResult =
  | { success: true; content: ResumeContent }
  | { success: false; error: string };

const MAX_TOKENS = 4096;
const TEMPERATURE = 0.7;

// Sized so three full roles still fit on one A4 page
export const RESUME_LIMITS = {
  summary: 420,
  bulletsPerRole: 4,
  bullet: 170,
} as const;

const generationSchema = z.object({
  summary: z.string(),
  roles: z.array(z.object({ bullets: z.array(z.string()) })),
});

export type ResumeGeneration = z.infer<typeof generationSchema>;

const SYSTEM_PROMPT = `You write the prose for a one-page professional resume from a job seeker's saved profile.

You write two things only: a professional summary and bullet points for each role. Names, companies, titles, dates, education and the skills list are printed from the profile as they are, so do not repeat them as a list.

Rules:
- Use only what the profile states. Never invent an employer, a number, a metric, a technology, a team size or an achievement. If the profile gives no figure, write the bullet without one.
- summary: two or three sentences in the implied first person (no "I"), covering the candidate's title, years of experience, strongest skills and the kind of role they are seeking. At most ${RESUME_LIMITS.summary} characters.
- roles: one entry per role in the profile, in the same order and the same number. For each, rewrite its responsibilities as up to ${RESUME_LIMITS.bulletsPerRole} bullets. Each bullet is one line, starts with a strong past-tense action verb (present tense for a current role), has no trailing period and is at most ${RESUME_LIMITS.bullet} characters.
- When a role has no responsibilities, return an empty bullets list for it. Do not guess what the person did.
- Plain text only: no markdown, no bullet characters, no quotation marks around a bullet.`;

export function getResumeRoles(profile: Profile): WorkExperience[] {
  return profile.work_experience
    .filter((role) => role.company.trim() !== "" || role.title.trim() !== "")
    .slice(0, MAX_WORK_EXPERIENCE_ROLES);
}

// One line of plain text, cut at a word boundary when it runs over
function cleanLine(value: string, max: number): string {
  const text = value
    .replace(/\s+/g, " ")
    .replace(/^[\s•\-*–—]+/, "")
    .trim();

  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, "");
}

function cleanBullets(values: string[]): string[] {
  return values
    .map((value) => cleanLine(value, RESUME_LIMITS.bullet).replace(/\.$/, ""))
    .filter((bullet) => bullet !== "")
    .slice(0, RESUME_LIMITS.bulletsPerRole);
}

// The model's output is free text. This lines the roles up with the profile's
// and keeps everything inside the one-page budget.
export function normalizeGeneration(
  generation: ResumeGeneration,
  roles: WorkExperience[],
): ResumeContent {
  return {
    summary: cleanLine(generation.summary, RESUME_LIMITS.summary),
    roleBullets: roles.map((role, index) => {
      const bullets = cleanBullets(generation.roles[index]?.bullets ?? []);

      // A role the model skipped still shows what the user wrote
      return bullets.length > 0
        ? bullets
        : cleanBullets(role.responsibilities.split("\n"));
    }),
  };
}

export async function generateResumeContent(
  profile: Profile,
): Promise<GenerationResult> {
  try {
    const roles = getResumeRoles(profile);
    const today = new Date().toISOString().slice(0, 10);

    const response = await createAnthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today's date is ${today}. Write the resume prose for this profile.\n\n${JSON.stringify(
            {
              current_title: profile.current_title,
              experience_level: profile.experience_level,
              years_experience: profile.years_experience,
              skills: profile.skills,
              industries: profile.industries,
              job_titles_seeking: profile.job_titles_seeking,
              education: profile.education,
              roles,
            },
            null,
            2,
          )}`,
        },
      ],
      output_config: { format: zodOutputFormat(generationSchema) },
    });

    const generation = response.parsed_output;

    if (response.stop_reason !== "end_turn" || !generation) {
      console.error(
        "[lib/resume-generation] incomplete response",
        response.stop_reason,
      );
      return { success: false, error: RESUME_GENERATION_ERROR };
    }

    const content = normalizeGeneration(generation, roles);

    if (content.summary === "") {
      console.error("[lib/resume-generation] empty summary");
      return { success: false, error: RESUME_GENERATION_ERROR };
    }

    return { success: true, content };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(
        "[lib/resume-generation] API error",
        error.status,
        error.message,
      );
      return { success: false, error: RESUME_GENERATION_ERROR };
    }

    console.error("[lib/resume-generation]", error);
    return { success: false, error: RESUME_GENERATION_ERROR };
  }
}
