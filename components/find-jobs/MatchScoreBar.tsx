type Props = {
  score: number;
};

const HIGH_SCORE = 90;
const MID_SCORE = 80;

function getFillClass(score: number): string {
  if (score >= HIGH_SCORE) {
    return "fill-success-alt";
  }
  if (score >= MID_SCORE) {
    return "fill-info-medium";
  }
  return "fill-warning";
}

export function MatchScoreBar({ score }: Props) {
  const percent = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div className="flex items-center justify-center gap-2">
      {/* An SVG so the fill width is an attribute, not an inline style */}
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        aria-hidden
        className="h-1 w-23 shrink-0 rounded-full bg-border-light"
      >
        <rect
          width={percent}
          height="4"
          rx="2"
          className={getFillClass(percent)}
        />
      </svg>
      <span className="text-sm font-semibold text-text-dark tabular-nums">
        {percent}%
      </span>
    </div>
  );
}
