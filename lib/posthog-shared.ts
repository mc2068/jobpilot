// Set by the signOut Server Action and consumed by instrumentation-client.ts.
// Lives outside posthog-client.ts so server code can import it without
// pulling the browser SDK into the server bundle.
export const POSTHOG_RESET_COOKIE = "posthog_reset";
