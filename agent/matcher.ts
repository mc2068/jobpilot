import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import type { JobMatch, MatchResult } from "@/agent/types";
import type { AdzunaJob } from "@/lib/adzuna";
import {
  AI_MODEL,
  createAnthropic,
  describeAnthropicError,
} from "@/lib/anthropic";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Profile } from "@/types";

const MAX_TOKENS = 1024;
const TEMPERATURE = 0.3;

const MATCH_LIMITS = {
  reason: 600,
  skillCount: 12,
  skillLength: 60,
} as const;

// Plain numbers and strings: the API does not enforce ranges or lengths, so
// normalizeMatch brings the output inside what the jobs table accepts.
const matchSchema = z.object({
  match_score: z.number(),
  match_reason: z.string(),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
});

export type MatchOutput = z.infer<typeof matchSchema>;

const SYSTEM_PROMPT = `You score how well one job posting fits one candidate, for a job search tool. The candidate sees the score next to the job and uses it to decide which postings are worth their time.

You are given the candidate's saved profile and a job posting. The posting's description is a short snippet, not the full text, so judge from the title, the company, the location and what the snippet says. Do not assume requirements the posting does not mention.

Return:
- match_score: a whole number from 0 to 100. ${MATCH_THRESHOLD} and above means the candidate should seriously consider applying. Weigh, in this order: whether the role is the kind of work the candidate does or is seeking, how much of the stated stack and requirements their skills and work history cover, whether the seniority fits their level and years of experience, and whether the location or remote setup fits their preferences. A role in a different discipline scores low even when a few skills overlap. Use the whole range: most postings from a broad search are not strong matches.
- match_reason: two or three sentences addressed to the candidate ("You have…"), naming the specific things that drove the score up or down. At most ${MATCH_LIMITS.reason} characters.
- matched_skills: skills from the candidate's profile that this posting asks for or clearly uses. Use the candidate's own wording. Empty when the snippet names none.
- missing_skills: skills or requirements the posting states that the profile does not show. Only what the posting actually says. Empty when there are none.

Use only the profile and the posting. Never invent a requirement, a skill or a fact about the company.`;

function cleanSkills(values: string[]): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];

  for (const value of values) {
    const skill = value.replace(/\s+/g, " ").trim();
    const key = skill.toLowerCase();

    if (
      skill === "" ||
      skill.length > MATCH_LIMITS.skillLength ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    skills.push(skill);
  }

  return skills.slice(0, MATCH_LIMITS.skillCount);
}

// Null when the score is not a usable number: the job is then skipped
export function normalizeMatch(output: MatchOutput): JobMatch | null {
  if (!Number.isFinite(output.match_score)) {
    return null;
  }

  return {
    matchScore: Math.min(100, Math.max(0, Math.round(output.match_score))),
    matchReason: output.match_reason
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MATCH_LIMITS.reason),
    matchedSkills: cleanSkills(output.matched_skills),
    missingSkills: cleanSkills(output.missing_skills),
  };
}

// The name, email and phone are left out: scoring does not need them
function describeCandidate(profile: Profile): string {
  return JSON.stringify(
    {
      current_title: profile.current_title,
      experience_level: profile.experience_level,
      years_experience: profile.years_experience,
      skills: profile.skills,
      industries: profile.industries,
      work_experience: profile.work_experience,
      education: profile.education,
      job_titles_seeking: profile.job_titles_seeking,
      location: profile.location,
      remote_preference: profile.remote_preference,
      preferred_locations: profile.preferred_locations,
    },
    null,
    2,
  );
}

function describeJob(job: AdzunaJob): string {
  return JSON.stringify(
    {
      title: job.title,
      company: job.company,
      location: job.location,
      contract_type: job.contractType,
      description_snippet: job.description,
    },
    null,
    2,
  );
}

export async function scoreJob(
  profile: Profile,
  job: AdzunaJob,
): Promise<MatchResult> {
  try {
    const response = await createAnthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `CANDIDATE PROFILE:\n${describeCandidate(profile)}\n\nJOB POSTING:\n${describeJob(job)}`,
        },
      ],
      output_config: { format: zodOutputFormat(matchSchema) },
    });

    const output = response.parsed_output;

    if (response.stop_reason !== "end_turn" || !output) {
      console.error(
        "[agent/matcher] incomplete response",
        response.stop_reason,
      );
      return { success: false, error: "The scoring response was incomplete." };
    }

    const match = normalizeMatch(output);

    if (!match) {
      console.error("[agent/matcher] unusable score", output.match_score);
      return { success: false, error: "The scoring response had no score." };
    }

    return { success: true, match };
  } catch (error) {
    console.error("[agent/matcher]", error);
    return {
      success: false,
      error: describeAnthropicError(error, "The scoring request failed."),
    };
  }
}
