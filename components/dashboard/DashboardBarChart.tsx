"use client";

import {
  Bar,
  BarChart,
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

const BAR_FILLS = {
  info: "var(--color-info)",
  success: "var(--color-success)",
};

type Props = {
  data: ChartPoint[];
  // The y-axis labels, lowest first; the last one is the top of the chart
  ticks: number[];
  tone: keyof typeof BAR_FILLS;
  barSize: number;
};

export function DashboardBarChart({ data, ticks, tone, barSize }: Props) {
  return (
    <BarChart
      responsive
      data={data}
      margin={CHART_MARGIN}
      className={CHART_CLASS}
    >
      <CartesianGrid {...CHART_GRID} />
      <XAxis dataKey="label" {...CHART_X_AXIS} />
      <YAxis
        ticks={ticks}
        domain={[ticks[0] ?? 0, ticks[ticks.length - 1] ?? "auto"]}
        {...CHART_Y_AXIS}
      />
      <Tooltip
        content={ChartTooltip}
        cursor={{ fill: "var(--color-surface-secondary)" }}
      />
      <Bar
        dataKey="value"
        fill={BAR_FILLS[tone]}
        barSize={barSize}
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  );
}
