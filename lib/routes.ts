export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";
export const FIND_JOBS_PATH = "/find-jobs";
export const PROFILE_PATH = "/profile";
export const CALLBACK_PATH = "/callback";
export const RESUME_EXTRACT_API_PATH = "/api/resume/extract";
export const RESUME_GENERATE_API_PATH = "/api/resume/generate";
export const RESUME_FILE_API_PATH = "/api/resume";
export const AGENT_FIND_API_PATH = "/api/agent/find";

export const getJobDetailsPath = (jobId: string): string =>
  `${FIND_JOBS_PATH}/${jobId}`;

export const OAUTH_ERROR = "oauth";
export const LOGIN_ERROR_PATH = `${LOGIN_PATH}?error=${OAUTH_ERROR}`;

export const PROTECTED_PATH_PREFIXES = [
  DASHBOARD_PATH,
  PROFILE_PATH,
  FIND_JOBS_PATH,
];
