import type { ReactNode } from "react";

import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import type { ChartSeries } from "@/types";

const CHART_ERROR = "We couldn’t load this chart. Please refresh the page.";

type Props = {
  // Null when the data could not be read. Started by the page, awaited here so
  // the chart streams in behind a Suspense fallback.
  series: Promise<ChartSeries | null>;
  emptyMessage: string;
  children: (series: ChartSeries) => ReactNode;
};

export async function ChartSlot({ series, emptyMessage, children }: Props) {
  const result = await series;

  if (!result) {
    return <ChartPlaceholder state="error" message={CHART_ERROR} />;
  }

  if (result.isEmpty) {
    return <ChartPlaceholder state="empty" message={emptyMessage} />;
  }

  return children(result);
}
