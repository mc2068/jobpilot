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
