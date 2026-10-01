import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const EXPORT_TIMEOUT_MS = 5000;

type LogAttributes = Record<string, string | number | boolean>;

let loggerProvider: LoggerProvider | null | undefined;

function getLoggerProvider(): LoggerProvider | null {
  if (loggerProvider !== undefined) {
    return loggerProvider;
  }

  // Warn instead of throwing: these helpers run inside auth flows, including
  // their catch blocks, and a missing analytics key must not break sign-in.
  if (!posthogKey || !posthogHost) {
    console.warn(
      "[lib/posthog-logger] NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN or NEXT_PUBLIC_POSTHOG_HOST is missing, server logs are disabled",
    );
    loggerProvider = null;
    return loggerProvider;
  }

  const exporter = new OTLPLogExporter({
    url: `${posthogHost}/i/v1/logs`,
    headers: { Authorization: `Bearer ${posthogKey}` },
    timeoutMillis: EXPORT_TIMEOUT_MS,
  });

  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "jobpilot" }),
    processors: [new SimpleLogRecordProcessor({ exporter })],
  });
  return loggerProvider;
}

async function emitLog(
  severityNumber: SeverityNumber,
  severityText: string,
  body: string,
  attributes?: LogAttributes,
): Promise<void> {
  const provider = getLoggerProvider();

  if (!provider) {
    return;
  }

  try {
    provider.getLogger("jobpilot.posthog").emit({
      severityNumber,
      severityText,
      body,
      attributes,
    });
    await provider.forceFlush();
  } catch (error) {
    console.error("[lib/posthog-logger]", error);
  }
}

// Both await a network call, so run them inside after() from next/server
// rather than on the path that produces the response.
export async function logPostHogInfo(
  body: string,
  attributes?: LogAttributes,
): Promise<void> {
  await emitLog(SeverityNumber.INFO, "INFO", body, attributes);
}

export async function logPostHogError(
  body: string,
  attributes?: LogAttributes,
): Promise<void> {
  await emitLog(SeverityNumber.ERROR, "ERROR", body, attributes);
}
