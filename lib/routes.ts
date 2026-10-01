export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";
export const FIND_JOBS_PATH = "/find-jobs";
export const PROFILE_PATH = "/profile";
export const CALLBACK_PATH = "/callback";
export const RESUME_EXTRACT_API_PATH = "/api/resume/extract";

export const OAUTH_ERROR = "oauth";
export const LOGIN_ERROR_PATH = `${LOGIN_PATH}?error=${OAUTH_ERROR}`;

export const PROTECTED_PATH_PREFIXES = [
  DASHBOARD_PATH,
  PROFILE_PATH,
  FIND_JOBS_PATH,
];
