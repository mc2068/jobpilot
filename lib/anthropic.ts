import Anthropic from "@anthropic-ai/sdk";

// Every plain text AI call uses this model. The Stagehand browser agent
// configures its own.
export const AI_MODEL = "claude-haiku-4-5";

const REQUEST_TIMEOUT_MS = 60_000;

// Lets a route refuse early instead of failing on its first AI call
export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Reads ANTHROPIC_API_KEY from the environment. Server-side only.
export function createAnthropic(): Anthropic {
  return new Anthropic({ timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
}

// A readable reason for agent_logs. The raw error stays in the server console.
// `fallback` is the sentence for an error that is not an Anthropic.APIError.
export function describeAnthropicError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "The AI service rejected the API key.";
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return "The AI service refused the request for this account.";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "The AI service rate limit was reached.";
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return "The AI service could not be reached.";
  }
  if (error instanceof Anthropic.APIError) {
    return `The AI service returned an error (${error.status ?? "no status"}).`;
  }

  // A missing API key lands here as a plain Error. Routes check for the key
  // before they start, so this is the unexpected case.
  return fallback;
}
