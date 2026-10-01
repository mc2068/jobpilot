import { CircleAlert } from "lucide-react";

type Props =
  | { state: "loading" }
  | { state: "empty" | "error"; message: string };

// Takes the chart's place in a ChartCard at the same height, so the card does
// not jump when the chart arrives.
export function ChartPlaceholder(props: Props) {
  if (props.state === "loading") {
    return (
      <div
        role="status"
        className="h-[280px] w-full animate-pulse rounded-lg bg-surface-secondary"
      >
        <span className="sr-only">Loading chart…</span>
      </div>
    );
  }

  if (props.state === "error") {
    return (
      <div className="flex h-[280px] w-full items-center justify-center">
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-text-dark"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
          {props.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[280px] w-full items-center justify-center">
      <p className="max-w-[320px] text-center text-sm text-text-muted">
        {props.message}
      </p>
    </div>
  );
}
