import { CircleAlert } from "lucide-react";

import type { ActivityEntry, ActivityTone } from "@/types";

const DOT_CLASSES: Record<ActivityTone, { ring: string; dot: string }> = {
  info: { ring: "bg-info-light", dot: "bg-info" },
  success: { ring: "bg-success-light", dot: "bg-success-alt" },
};

type Props = {
  // Null when the activity could not be read
  entries: ActivityEntry[] | null;
};

export function RecentActivity({ entries }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <h2 className="border-b border-border px-6 py-5 text-base font-semibold text-text-primary">
        Recent Activity
      </h2>

      {entries === null ? (
        <p
          role="alert"
          className="flex items-start gap-2 p-6 text-sm text-text-dark"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
          We couldn’t load your recent activity. Please refresh the page.
        </p>
      ) : entries.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-text-muted">
          No activity yet. Your searches and company research will show up
          here.
        </p>
      ) : (
        <ul className="flex flex-col gap-6 py-6 pr-6 pl-4">
          {entries.map(({ id, tone, message, time }, index) => (
            <li key={id} className="relative flex gap-4.5">
              {index < entries.length - 1 && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-[7px] w-0.5 bg-border"
                />
              )}
              <span
                aria-hidden
                className={`relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${DOT_CLASSES[tone].ring}`}
              >
                <span
                  className={`size-2 rounded-full ${DOT_CLASSES[tone].dot}`}
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {message}
                </p>
                <p className="mt-1 text-xs text-text-muted">{time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
