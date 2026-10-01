import type { TooltipContentProps } from "recharts";

export function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  const value = payload?.[0]?.value;

  if (!active || value === undefined) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="text-text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-text-primary">{value}</p>
    </div>
  );
}
