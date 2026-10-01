import { z } from "zod";

export const DOSSIER_LIMITS = {
  paragraph: 800,
  item: 400,
  techStack: 15,
  culture: 6,
  yourEdge: 6,
  gapsToAddress: 6,
  smartQuestions: 6,
  interviewPrep: 8,
} as const;

// What the model writes. Plain strings and arrays: the API does not enforce
// lengths or counts, so normalizeDossier brings the output inside the limits.
export const dossierOutputSchema = z.object({
  companyOverview: z.string(),
  techStack: z.array(z.string()),
  culture: z.array(z.string()),
  whyThisRole: z.string(),
  yourEdge: z.array(z.string()),
  gapsToAddress: z.array(z.string()),
  smartQuestions: z.array(z.string()),
  interviewPrep: z.array(z.string()),
});

export type DossierOutput = z.infer<typeof dossierOutputSchema>;

// What jobs.company_research holds: the model's fields plus two set by code.
// `sources` is the pages that were actually read, so the model can't invent a
// link.
const storedDossierSchema = dossierOutputSchema.extend({
  sources: z.array(z.string()),
  researchedAt: z.string(),
});

export type CompanyDossier = z.infer<typeof storedDossierSchema>;

const cleanText = (value: string, max: number): string =>
  value.replace(/\s+/g, " ").trim().slice(0, max);

function cleanList(values: string[], count: number): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const item = cleanText(value, DOSSIER_LIMITS.item);
    const key = item.toLowerCase();

    if (item === "" || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(item);
  }

  return items.slice(0, count);
}

// Null when the model gave no overview or no reason for the role: a dossier
// without them is not worth saving.
export function normalizeDossier(
  output: DossierOutput,
): DossierOutput | null {
  const companyOverview = cleanText(
    output.companyOverview,
    DOSSIER_LIMITS.paragraph,
  );
  const whyThisRole = cleanText(output.whyThisRole, DOSSIER_LIMITS.paragraph);

  if (companyOverview === "" || whyThisRole === "") {
    return null;
  }

  return {
    companyOverview,
    techStack: cleanList(output.techStack, DOSSIER_LIMITS.techStack),
    culture: cleanList(output.culture, DOSSIER_LIMITS.culture),
    whyThisRole,
    yourEdge: cleanList(output.yourEdge, DOSSIER_LIMITS.yourEdge),
    gapsToAddress: cleanList(
      output.gapsToAddress,
      DOSSIER_LIMITS.gapsToAddress,
    ),
    smartQuestions: cleanList(
      output.smartQuestions,
      DOSSIER_LIMITS.smartQuestions,
    ),
    interviewPrep: cleanList(
      output.interviewPrep,
      DOSSIER_LIMITS.interviewPrep,
    ),
  };
}

// jobs.company_research is free-form jsonb: anything that is not a complete
// dossier (a row saved by an older version, say) reads as "no research yet".
export function parseDossier(value: unknown): CompanyDossier | null {
  const parsed = storedDossierSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
