import { Sparkles } from "lucide-react";

import { SkillTag } from "@/components/job-details/SkillTag";
import type { JobDetails } from "@/types";

type Props = {
  job: Pick<JobDetails, "match_reason" | "matched_skills" | "missing_skills">;
};

const LABEL_CLASS =
  "text-xs font-semibold tracking-[0.05em] text-text-secondary uppercase";
const GROUP_LABEL_CLASS = "text-xs text-text-muted";

export function MatchScore({ job }: Props) {
  const { match_reason, matched_skills, missing_skills } = job;
  const hasSkills = matched_skills.length > 0 || missing_skills.length > 0;

  return (
    <>
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-lightest">
            <Sparkles className="size-4 text-success" />
          </span>
          <h2 className={LABEL_CLASS}>AI Match Reasoning</h2>
        </div>
        {match_reason ? (
          <p className="mt-4 text-[15px] leading-[22px] text-text-primary">
            {match_reason}
          </p>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            No match reasoning was saved for this job.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className={LABEL_CLASS}>Required Skills vs Your Profile</h2>
        {hasSkills ? (
          <div className="mt-4 flex flex-col gap-4">
            {matched_skills.length > 0 && (
              <div>
                <h3 className={GROUP_LABEL_CLASS}>You have</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {matched_skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} matched />
                  ))}
                </ul>
              </div>
            )}
            {missing_skills.length > 0 && (
              <div>
                <h3 className={GROUP_LABEL_CLASS}>Gap skills</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {missing_skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} matched={false} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            No skills were compared for this job.
          </p>
        )}
      </section>
    </>
  );
}
