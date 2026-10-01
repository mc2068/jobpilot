import { PostHog } from "posthog-node";

type ServerEvent = "user_signed_in";

type EventProperties = Record<string, string | number | boolean>;

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const SHUTDOWN_TIMEOUT_MS = 5000;

// flushAt 1 / flushInterval 0 because route handlers and actions are
// short-lived: a batched event would be dropped when the function returns.
export function createPostHogServer(): PostHog | null {
  if (!posthogKey || !posthogHost) {
    return null;
  }

  return new PostHog(posthogKey, {
    host: posthogHost,
    flushAt: 1,
    flushInterval: 0,
  });
}

// Awaits a network call, so run it inside after() from next/server rather
// than on the path that produces the response.
export async function captureServerEvent(
  userId: string,
  event: ServerEvent,
  properties?: EventProperties,
): Promise<void> {
  const posthog = createPostHogServer();

  if (!posthog) {
    return;
  }

  try {
    posthog.capture({
      distinctId: userId,
      event,
      properties: { userId, ...properties },
    });
    await posthog.shutdown(SHUTDOWN_TIMEOUT_MS);
  } catch (error) {
    console.error("[lib/posthog-server]", error);
  }
}
