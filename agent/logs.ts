import type { InsForgeClient } from "@insforge/sdk";

import type { AgentLogEntry } from "@/agent/types";

const MAX_MESSAGE_LENGTH = 500;

// Never throws: a log line that can't be written must not fail the run.
// Several entries go in as one insert.
export async function logAgent(
  insforge: InsForgeClient,
  entries: AgentLogEntry | AgentLogEntry[],
): Promise<void> {
  const rows = [entries].flat().map((entry) => ({
    user_id: entry.userId,
    run_id: entry.runId,
    job_id: entry.jobId ?? null,
    level: entry.level,
    message: entry.message.slice(0, MAX_MESSAGE_LENGTH),
  }));

  if (rows.length === 0) {
    return;
  }

  try {
    const { error } = await insforge.database.from("agent_logs").insert(rows);

    if (error) {
      console.error("[agent/logs]", error);
    }
  } catch (error) {
    console.error("[agent/logs]", error);
  }
}
