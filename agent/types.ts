export type JobMatch = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export type MatchResult =
  | { success: true; match: JobMatch }
  | { success: false; error: string };

export type DiscoveryResult =
  | {
      success: true;
      // One score per saved job
      matchScores: number[];
      strongMatches: number;
    }
  | { success: false; error: string };

export type AgentLogLevel = "info" | "success" | "warning" | "error";

export type AgentLogEntry = {
  userId: string;
  runId: string | null;
  jobId?: string | null;
  level: AgentLogLevel;
  message: string;
};
