import Browserbase from "@browserbasehq/sdk";

const FETCH_TIMEOUT_MS = 15_000;

// Lets a route refuse early instead of failing on its first fetch
export function isBrowserbaseConfigured(): boolean {
  return Boolean(process.env.BROWSERBASE_API_KEY);
}

// Reads BROWSERBASE_API_KEY from the environment. Server-side only. No
// retries: a page that does not answer in time is skipped, not waited for.
function createBrowserbase(): Browserbase {
  return new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
    timeout: FETCH_TIMEOUT_MS,
    maxRetries: 0,
  });
}

// The page as markdown through the Browserbase Fetch API (plain HTTP, no
// browser session, so scripts do not run). Null when the page can't be read.
// Never throws: the caller carries on with whatever pages it did get.
export async function fetchPageMarkdown(url: string): Promise<string | null> {
  try {
    const response = await createBrowserbase().fetchAPI.create({
      url,
      format: "markdown",
      allowRedirects: true,
    });

    if (response.statusCode >= 400 || typeof response.content !== "string") {
      return null;
    }

    return response.content;
  } catch (error) {
    // A site that is down or blocks the fetch is routine: log the status, not
    // the whole error object
    console.error(
      "[lib/browserbase] fetch",
      url,
      error instanceof Browserbase.APIError
        ? `status ${error.status}`
        : error,
    );
    return null;
  }
}
