// A job scored at or above this is a strong match
export const MATCH_THRESHOLD = 70;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function formatTimeAgo(isoDate: string): string {
  const elapsed = Date.now() - new Date(isoDate).getTime();

  if (Number.isNaN(elapsed)) {
    return "";
  }
  if (elapsed < MINUTE_MS) {
    return "Just now";
  }
  if (elapsed < HOUR_MS) {
    return pluralize(Math.floor(elapsed / MINUTE_MS), "minute");
  }
  if (elapsed < DAY_MS) {
    return pluralize(Math.floor(elapsed / HOUR_MS), "hour");
  }
  if (elapsed < 2 * DAY_MS) {
    return "Yesterday";
  }
  return pluralize(Math.floor(elapsed / DAY_MS), "day");
}
