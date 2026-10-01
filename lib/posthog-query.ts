import { z } from "zod";

const QUERY_TIMEOUT_MS = 5000;

const responseSchema = z.object({
  results: z.array(z.array(z.unknown())),
});

type QueryValues = Record<string, string | number>;

// Events are sent to the ingestion host (us.i.posthog.com) and read back from
// the app host (us.posthog.com). A self-hosted address is used as it is.
function getQueryHost(): string | null {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!host) {
    return null;
  }

  return host.replace(".i.posthog.com", ".posthog.com").replace(/\/+$/, "");
}

// Reading events back needs a personal API key (scope query:read) and the
// project id, on top of the public token that sends them. Server-side only.
export function isPostHogQueryConfigured(): boolean {
  return Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY &&
      process.env.POSTHOG_PROJECT_ID &&
      getQueryHost(),
  );
}

// Runs one HogQL query and returns its rows, or null when PostHog can't be
// read. Never throws. Anything that comes from a user goes in `values` and is
// written in the query as {name}, never joined into the query text.
export async function runHogQLQuery(
  name: string,
  query: string,
  values: QueryValues,
): Promise<unknown[][] | null> {
  const host = getQueryHost();
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!host || !apiKey || !projectId) {
    console.warn("[lib/posthog-query] not configured, skipping", name);
    return null;
  }

  try {
    const response = await fetch(
      `${host}/api/projects/${encodeURIComponent(projectId)}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          query: { kind: "HogQLQuery", query, values },
        }),
        signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[lib/posthog-query]", name, `status ${response.status}`);
      return null;
    }

    const parsed = responseSchema.safeParse(await response.json());

    if (!parsed.success) {
      console.error("[lib/posthog-query]", name, "unexpected response shape");
      return null;
    }

    return parsed.data.results;
  } catch (error) {
    console.error(
      "[lib/posthog-query]",
      name,
      error instanceof Error ? error.name : error,
    );
    return null;
  }
}
