import posthog from "posthog-js";

export type ClientEvent =
  | "navbar_signup_clicked"
  | "primary_cta_clicked"
  | "job_search_cta_clicked"
  | "oauth_sign_in_started"
  | "oauth_sign_in_failed"
  | "user_signed_out";

export type EventProperties = Record<string, string | number | boolean>;

export const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
    process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

// Pass beforeUnload when the click leaves the site (e.g. to an OAuth
// provider): a normal request can be cancelled by the page unloading.
export function captureEvent(
  event: ClientEvent,
  properties?: EventProperties,
  beforeUnload: boolean = false,
): void {
  if (isPostHogConfigured) {
    posthog.capture(
      event,
      properties,
      beforeUnload ? { transport: "sendBeacon" } : undefined,
    );
  }
}

export function captureException(error: Error): void {
  if (isPostHogConfigured) {
    posthog.captureException(error);
  }
}
