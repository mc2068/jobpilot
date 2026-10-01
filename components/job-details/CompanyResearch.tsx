import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

import { ResearchButton } from "@/components/job-details/ResearchButton";
import type { CompanyDossier } from "@/lib/company-research";
import { getSafeUrl } from "@/lib/job-details";
import { formatTimeAgo } from "@/lib/utils";

type Props = {
  jobId: string;
  company: string;
  // Null until the company has been researched
  dossier: CompanyDossier | null;
};

const LABEL_CLASS =
  "text-xs font-semibold tracking-[0.05em] text-text-secondary uppercase";
const TEXT_CLASS = "text-[15px] leading-[22px] text-text-primary";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className={LABEL_CLASS}>{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-[22px] text-text-primary marker:text-text-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section title={title}>
      <BulletList items={items} />
    </Section>
  );
}

function Sources({ dossier }: { dossier: CompanyDossier }) {
  const summary = `Researched ${formatTimeAgo(dossier.researchedAt)}`;

  if (dossier.sources.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        {summary}. No pages from the company’s website could be read, so this
        briefing comes from the job posting and your profile.
      </p>
    );
  }

  return (
    <div className="text-xs text-text-muted">
      <p>{summary}. Sources:</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {dossier.sources.map((source) => {
          const href = getSafeUrl(source);

          return (
            <li key={source} className="truncate">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-medium underline-offset-2 hover:text-accent hover:underline"
                >
                  {source.replace(/^https?:\/\//i, "")}
                </a>
              ) : (
                source
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Dossier({ dossier }: { dossier: CompanyDossier }) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <Section title="Company Overview">
        <p className={TEXT_CLASS}>{dossier.companyOverview}</p>
      </Section>

      {dossier.techStack.length > 0 && (
        <Section title="Tech Stack">
          <ul className="flex flex-wrap gap-2">
            {dossier.techStack.map((technology) => (
              <li
                key={technology}
                className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-dark"
              >
                {technology}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <ListSection title="Culture" items={dossier.culture} />

      <Section title="Why This Role">
        <p className={TEXT_CLASS}>{dossier.whyThisRole}</p>
      </Section>

      {dossier.yourEdge.length > 0 && (
        <div className="rounded-lg border border-accent/30 bg-accent-muted p-4">
          <h3 className="text-xs font-semibold tracking-[0.05em] text-accent uppercase">
            Your Edge
          </h3>
          <div className="mt-2">
            <BulletList items={dossier.yourEdge} />
          </div>
        </div>
      )}

      <ListSection title="Gaps to Address" items={dossier.gapsToAddress} />
      <ListSection title="Smart Questions" items={dossier.smartQuestions} />
      <ListSection title="Interview Prep" items={dossier.interviewPrep} />

      <Sources dossier={dossier} />
    </div>
  );
}

export function CompanyResearch({ jobId, company, dossier }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-muted">
            <Building2 className="size-4 text-accent" />
          </span>
          <h2 className="text-base font-semibold text-text-primary">
            Company Research
          </h2>
        </div>
        <ResearchButton jobId={jobId} hasResearch={dossier !== null} />
      </div>

      {dossier ? (
        <Dossier dossier={dossier} />
      ) : (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-surface-secondary">
            <Building2 className="size-6 text-text-muted" />
          </span>
          <p className="mt-4 text-sm font-medium text-text-primary">
            No research yet
          </p>
          <p className="mt-1 max-w-[320px] text-sm text-text-muted">
            Click “Research Company” to let the AI read {company}’s public
            website and build a briefing for this role.
          </p>
        </div>
      )}
    </section>
  );
}
