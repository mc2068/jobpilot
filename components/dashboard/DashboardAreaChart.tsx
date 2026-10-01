"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import {
  CHART_CLASS,
  CHART_GRID,
  CHART_MARGIN,
  CHART_X_AXIS,
  CHART_Y_AXIS,
} from "@/lib/dashboard-charts";
import type { ChartPoint } from "@/types";

type Props = {
  data: ChartPoint[];
  // The y-axis labels, lowest first; the last one is the top of the chart
  ticks: number[];
  // Label one point in this many, counted back from the last. Default: all
  labelEvery?: number;
};

export function DashboardAreaChart({ data, ticks, labelEvery = 1 }: Props) {
  const gradientId = useId();
  const xTicks = data
    .filter((_, index) => (data.length - 1 - index) % labelEvery === 0)
    .map((point) => point.label);

  return (
    <AreaChart
      responsive
      data={data}
      margin={CHART_MARGIN}
      className={CHART_CLASS}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.2} />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid {...CHART_GRID} />
      <XAxis dataKey="label" ticks={xTicks} {...CHART_X_AXIS} />
      <YAxis
        ticks={ticks}
        domain={[ticks[0] ?? 0, ticks[ticks.length - 1] ?? "auto"]}
        {...CHART_Y_AXIS}
      />
      <Tooltip
        content={ChartTooltip}
        cursor={{ stroke: "var(--color-border-muted)" }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="var(--color-accent)"
        strokeWidth={3}
        fill={`url(#${gradientId})`}
        activeDot={{ r: 4, stroke: "var(--color-surface)", strokeWidth: 2 }}
      />
    </AreaChart>
  );
}
