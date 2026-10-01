// Shared by the dashboard's recharts components, so the three charts line up.

// Axis text takes its size and colour from these classes: recharts sets a
// fill attribute on tick labels, which a CSS class overrides. The surface may
// overflow so the first and last x labels of the area chart are not clipped.
export const CHART_CLASS =
  "h-[280px] w-full text-xs [&_.recharts-cartesian-axis-tick-value]:fill-chart-axis [&_.recharts-surface]:overflow-visible";

export const CHART_MARGIN = { top: 10, right: 10, bottom: 0, left: 0 };

export const CHART_GRID = {
  vertical: false,
  stroke: "var(--color-border)",
  strokeDasharray: "4 4",
};

export const CHART_X_AXIS = {
  axisLine: false,
  tickLine: false,
  tickMargin: 10,
  interval: 0,
};

export const CHART_Y_AXIS = {
  axisLine: false,
  tickLine: false,
  width: 40,
};
