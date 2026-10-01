import { createBrowserClient } from "@insforge/sdk/ssr";

// Refreshes an expired access token through POST /api/auth/refresh.
export const insforge = createBrowserClient();
