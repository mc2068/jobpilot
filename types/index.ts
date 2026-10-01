export const OAUTH_PROVIDERS = ["google", "github"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

// The value lists below mirror the check constraints on the profiles table.
export const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "lead"] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const REMOTE_PREFERENCES = ["remote", "onsite", "hybrid", "any"] as const;

export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];

export const WORK_AUTHORIZATIONS = [
  "citizen",
  "permanent_resident",
  "visa_required",
] as const;

export type WorkAuthorization = (typeof WORK_AUTHORIZATIONS)[number];

export const COVER_LETTER_TONES = ["formal", "casual", "enthusiastic"] as const;

export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number];

// The values the Highest Degree dropdown saves, curly apostrophes included.
export const DEGREES = [
  "High School",
  "Associate",
  "Bachelor’s",
  "Master’s",
  "Doctorate",
  "Other",
] as const;

export const MAX_WORK_EXPERIENCE_ROLES = 3;

// Dates are "YYYY-MM", the value format of <input type="month">.
export type WorkExperience = {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  responsibilities: string;
};

export type Education = {
  degree: string;
  field_of_study: string;
  institution: string;
  graduation_year: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: ExperienceLevel | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperience[];
  education: Education | null;
  job_titles_seeking: string[];
  remote_preference: RemotePreference | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: CoverLetterTone | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: WorkAuthorization | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
};

// The columns the profile form writes. Email comes from auth and is never saved.
export type ProfileFormValues = Pick<
  Profile,
  | "full_name"
  | "phone"
  | "location"
  | "current_title"
  | "experience_level"
  | "years_experience"
  | "skills"
  | "industries"
  | "work_experience"
  | "education"
  | "job_titles_seeking"
  | "remote_preference"
  | "preferred_locations"
  | "salary_expectation"
  | "linkedin_url"
  | "portfolio_url"
  | "work_authorization"
>;

export type ActionResult = {
  success: boolean;
  error?: string;
};

export type ApiResult<Data> = ActionResult & {
  data?: Data;
};

// What components/profile/ResultMessage.tsx shows after an action.
export type ResultNotice = {
  success: boolean;
  message: string;
};

export type ProfileCompletion = {
  percent: number;
  missingFields: string[];
};
