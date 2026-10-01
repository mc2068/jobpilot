import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  AI_MODEL,
  createAnthropic,
  describeAnthropicError,
} from "@/lib/anthropic";
import {
  dossierOutputSchema,
  normalizeDossier,
  type DossierOutput,
} from "@/lib/company-research";
import type { JobDetails, Profile } from "@/types";

const MAX_TOKENS = 4096;
const TEMPERATURE = 0.4;
// The route has a 60s budget shared with the page fetches, so one slow answer
// is a failed run, not two attempts.
const REQUEST_OPTIONS = { timeout: 40_000, maxRetries: 0 };

export type ResearchPage = {
  url: string;
  // Already cleaned and cut to length (agent/company-site.ts)
  text: string;
};

export type DossierJob = Pick<
  JobDetails,
  "title" | "company" | "about_role" | "matched_skills" | "missing_skills"
>;

export type DossierResult =
  | { success: true; dossier: DossierOutput }
  | { success: false; error: string };

const SYSTEM_PROMPT = `You are a sharp career strategist preparing a candidate to apply for one specific role. You are given (a) text from pages on the company's own website, which may be missing, (b) the job posting, and (c) the candidate's profile. Write a concise, concrete briefing that gives this candidate an edge for this role.

Rules:
- Ground every claim about the company in the website text or the job posting. Never invent funding, customers, headcount, products or any other fact. When the website text is thin or missing, infer carefully from the job posting and say plainly that it is inferred ("The posting suggests…").
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product and values. No advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame each gap honestly and which adjacent experience to lean on.
- Questions and talking points must point at real details from the website text or the posting, the kind that show the candidate did their homework.
- Keep every item to one or two sentences. No filler.
- The job description is a short snippet, not the full posting. Do not assume requirements it does not state.

Return:
- companyOverview: what the company does and who it is for.
- techStack: specific technologies the website text or posting names. Empty when none are named.
- culture: stated values and ways of working. Empty when nothing is stated.
- whyThisRole: why this role likely exists and what it needs.
- yourEdge: where this candidate is strongest for this role.
- gapsToAddress: the gaps, each reframed as a plan.
- smartQuestions: questions the candidate can ask in an interview.
- interviewPrep: topics to prepare for this role.`;

// The name, email and phone are left out: the briefing does not need them
function describeCandidate(profile: Profile): string {
  return JSON.stringify(
    {
      current_title: profile.current_title,
      experience_level: profile.experience_level,
      years_experience: profile.years_experience,
      skills: profile.skills,
      work_experience: profile.work_experience,
    },
    null,
    2,
  );
}

function describeResearch(pages: ResearchPage[]): string {
  if (pages.length === 0) {
    return "No pages from the company's website could be read.";
  }

  return pages.map((page) => `PAGE ${page.url}\n${page.text}`).join("\n\n---\n\n");
}

export async function synthesizeDossier(
  pages: ResearchPage[],
  job: DossierJob,
  profile: Profile,
): Promise<DossierResult> {
  const jobPosting = JSON.stringify(
    {
      title: job.title,
      company: job.company,
      description_snippet: job.about_role,
      matched_skills: job.matched_skills,
      missing_skills: job.missing_skills,
    },
    null,
    2,
  );

  try {
    const response = await createAnthropic().messages.parse(
      {
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `COMPANY WEBSITE TEXT:\n${describeResearch(pages)}\n\nJOB POSTING:\n${jobPosting}\n\nCANDIDATE PROFILE:\n${describeCandidate(profile)}`,
          },
        ],
        output_config: { format: zodOutputFormat(dossierOutputSchema) },
      },
      REQUEST_OPTIONS,
    );

    const output = response.parsed_output;

    if (response.stop_reason !== "end_turn" || !output) {
      console.error("[agent/dossier] incomplete response", response.stop_reason);
      return { success: false, error: "The briefing response was incomplete." };
    }

    const dossier = normalizeDossier(output);

    if (!dossier) {
      console.error("[agent/dossier] empty overview or role");
      return { success: false, error: "The briefing response was empty." };
    }

    return { success: true, dossier };
  } catch (error) {
    console.error("[agent/dossier]", error);
    return {
      success: false,
      error: describeAnthropicError(error, "The briefing request failed."),
    };
  }
}
