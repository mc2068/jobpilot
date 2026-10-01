import type { DashboardStat, StatTrend } from "@/types";

const TREND_CLASSES: Record<StatTrend["tone"], string> = {
  up: "bg-success-lightest text-success-darker",
  down: "bg-error/7 text-error",
  flat: "bg-surface-secondary text-text-secondary",
};

type Props = {
  stat: DashboardStat;
};

export function StatCard({ stat }: Props) {
  const { label, value, trend, note } = stat;

  return (
    <li className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs text-text-muted">
        {trend && (
          <span
            className={`rounded-sm px-2 py-0.5 font-medium ${TREND_CLASSES[trend.tone]}`}
          >
            {trend.label}
          </span>
        )}
        {note}
      </p>
    </li>
  );
}
