import type { ReactNode } from "react";

type Tone = "success" | "info" | "accent" | "neutral";

type Props = {
  label: string;
  value: string;
  icon: ReactNode;
  tone: Tone;
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-lightest text-success",
  info: "bg-info-lightest text-info-medium",
  accent: "bg-accent-muted text-accent",
  neutral: "bg-surface-secondary text-text-secondary",
};

export function JobInfoCard({ label, value, icon, tone }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          title={value}
          className="truncate text-sm font-semibold text-text-primary"
        >
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium tracking-[0.05em] text-text-muted uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}
