import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

// The SDK owns this handler: the browser client in lib/insforge-client.ts
// posts here to refresh the session cookies, and expects the SDK's own
// response shape rather than the project's { success } wrapper.
export const { POST } = createRefreshAuthRouter();
