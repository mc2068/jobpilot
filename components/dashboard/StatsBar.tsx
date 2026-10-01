import { StatCard } from "@/components/dashboard/StatCard";
import type { DashboardStat } from "@/types";

type Props = {
  stats: DashboardStat[];
};

export function StatsBar({ stats }: Props) {
  return (
    // items-start: a card without a trend badge is 4px shorter, as in the design
    <ul className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </ul>
  );
}
