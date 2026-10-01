import { CircleAlert } from "lucide-react";

import type { ProfileCompletion } from "@/types";

const RING_SIZE = 130;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Props = {
  completion: ProfileCompletion;
};

export function CompletionIndicator({ completion }: Props) {
  const { percent, missingFields } = completion;
  const filled = (RING_CIRCUMFERENCE * percent) / 100;

  return (
    // The tint is translucent, so it needs a white layer underneath
    <section className="rounded-xl bg-surface shadow-sm">
      <div className="flex flex-col items-start gap-6 rounded-xl border border-error/15 bg-error/1 px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            <CircleAlert className="size-5 text-error" />
            Profile needs attention
          </h2>
          <p className="mt-2 max-w-[440px] text-sm leading-[22px] text-text-dark">
            Complete the missing fields to improve your chance of getting
            tailored matches and generating quality resumes.
          </p>
          {missingFields.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <li
                  key={field}
                  className="rounded-sm bg-error/7 px-2 py-1 text-xs font-semibold tracking-[0.04em] text-error uppercase"
                >
                  {field}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          role="img"
          aria-label={`Profile ${percent}% complete`}
          className="relative shrink-0"
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              className="stroke-error/15"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${RING_CIRCUMFERENCE}`}
              className="stroke-error"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[32px] font-bold text-text-primary">
            {percent}%
          </span>
        </div>
      </div>
    </section>
  );
}
