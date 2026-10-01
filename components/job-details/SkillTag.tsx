import { Check, X } from "lucide-react";

type Props = {
  skill: string;
  matched: boolean;
};

export function SkillTag({ skill, matched }: Props) {
  const Icon = matched ? Check : X;

  return (
    <li
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        matched
          ? "bg-success-lightest text-success-foreground"
          : "bg-accent-muted text-accent"
      }`}
    >
      <Icon aria-hidden className="size-3 shrink-0" />
      {skill}
    </li>
  );
}
