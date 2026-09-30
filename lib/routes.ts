export const HOME_PATH = "/";
export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";
export const CALLBACK_PATH = "/callback";

export const OAUTH_ERROR = "oauth";
export const LOGIN_ERROR_PATH = `${LOGIN_PATH}?error=${OAUTH_ERROR}`;

export const PROTECTED_PATH_PREFIXES = [DASHBOARD_PATH, "/profile", "/find-jobs"];
