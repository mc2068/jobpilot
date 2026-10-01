"use client";

import { useState, useTransition, type FormEvent, type Ref } from "react";
import { LoaderCircle, Plus } from "lucide-react";

import { saveProfile } from "@/actions/profile";
import { FormField } from "@/components/profile/FormField";
import { FormSection } from "@/components/profile/FormSection";
import { ResultMessage } from "@/components/profile/ResultMessage";
import { SelectInput } from "@/components/profile/SelectInput";
import { TagInput } from "@/components/profile/TagInput";
import { TextInput } from "@/components/profile/TextInput";
import { WorkExperienceCard } from "@/components/profile/WorkExperienceCard";
import {
  DEGREES,
  MAX_WORK_EXPERIENCE_ROLES,
  type ActionResult,
  type ExperienceLevel,
  type Profile,
  type ResultNotice,
  type RemotePreference,
  type WorkAuthorization,
  type WorkExperience,
} from "@/types";

type Option<Value extends string> = {
  value: Value;
  label: string;
};

type RoleEntry = {
  key: string;
  role: WorkExperience;
};

type Props = {
  profile: Profile;
  ref?: Ref<HTMLFormElement>;
  notice?: ResultNotice | null;
};

const WORK_AUTHORIZATION_OPTIONS: Option<WorkAuthorization>[] = [
  { value: "citizen", label: "Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "visa_required", label: "Visa Required" },
];

const EXPERIENCE_LEVEL_OPTIONS: Option<ExperienceLevel>[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

const REMOTE_PREFERENCE_OPTIONS: Option<RemotePreference>[] = [
  { value: "any", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const DEGREE_OPTIONS: Option<string>[] = DEGREES.map((degree) => ({
  value: degree,
  label: degree,
}));

const EMPTY_ROLE: WorkExperience = {
  company: "",
  title: "",
  start_date: "",
  end_date: null,
  is_current: false,
  responsibilities: "",
};

const GRID_CLASSES = "grid gap-5 sm:grid-cols-2";

export function ProfileForm({ profile, ref, notice }: Props) {
  const [roles, setRoles] = useState<RoleEntry[]>(() =>
    profile.work_experience.map((role, index) => ({
      key: `saved-${index}`,
      role,
    })),
  );

  const canAddRole = roles.length < MAX_WORK_EXPERIENCE_ROLES;

  const addRole = () => {
    setRoles([...roles, { key: crypto.randomUUID(), role: EMPTY_ROLE }]);
  };

  const removeRole = (key: string) => {
    setRoles(roles.filter((entry) => entry.key !== key));
  };

  const [result, setResult] = useState<ActionResult | null>(null);
  const [isSaving, startSaving] = useTransition();

  // Called from onSubmit rather than <form action>: React resets uncontrolled
  // fields after a form action, which would wipe the input on a failed save.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      try {
        setResult(await saveProfile(formData));
      } catch (error) {
        console.error("[profile/ProfileForm]", error);
        setResult({
          success: false,
          error: "We couldn’t save your profile. Please try again.",
        });
      }
    });
  };

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-8 shadow-sm"
    >
      <div className="pb-6">
        <h2 className="text-xl font-semibold text-text-primary">
          Profile Information
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent
          interactions.
        </p>
        {notice && (
          <ResultMessage
            success={notice.success}
            message={notice.message}
            className="mt-5"
          />
        )}
      </div>

      <FormSection title="Personal Info">
        <div className={GRID_CLASSES}>
          <FormField label="Full Name" htmlFor="full_name">
            <TextInput
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              placeholder="Your full name"
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <TextInput
              id="email"
              name="email"
              type="email"
              defaultValue={profile.email ?? ""}
              placeholder="you@example.com"
              readOnly
            />
          </FormField>
          <FormField label="Phone Number" htmlFor="phone">
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />
          </FormField>
          <FormField label="Location" htmlFor="location">
            <TextInput
              id="location"
              name="location"
              defaultValue={profile.location ?? ""}
              placeholder="City, Country"
            />
          </FormField>
          <FormField label="LinkedIn URL" htmlFor="linkedin_url">
            <TextInput
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              defaultValue={profile.linkedin_url ?? ""}
              placeholder="https://linkedin.com/in/username"
            />
          </FormField>
          <FormField label="Portfolio / GitHub" htmlFor="portfolio_url">
            <TextInput
              id="portfolio_url"
              name="portfolio_url"
              type="url"
              defaultValue={profile.portfolio_url ?? ""}
              placeholder="https://github.com/username"
            />
          </FormField>
          <FormField label="Work Authorization" htmlFor="work_authorization">
            <SelectInput
              id="work_authorization"
              name="work_authorization"
              options={WORK_AUTHORIZATION_OPTIONS}
              defaultValue={profile.work_authorization}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Professional Info">
        <div className={GRID_CLASSES}>
          <FormField
            label="Current/Recent Job Title"
            htmlFor="current_title"
            className="sm:col-span-2"
          >
            <TextInput
              id="current_title"
              name="current_title"
              defaultValue={profile.current_title ?? ""}
              placeholder="E.g. Frontend Engineer"
            />
          </FormField>
          <FormField label="Experience Level" htmlFor="experience_level">
            <SelectInput
              id="experience_level"
              name="experience_level"
              options={EXPERIENCE_LEVEL_OPTIONS}
              defaultValue={profile.experience_level}
            />
          </FormField>
          <FormField label="Years of Experience" htmlFor="years_experience">
            <TextInput
              id="years_experience"
              name="years_experience"
              type="number"
              min={0}
              defaultValue={profile.years_experience ?? ""}
              placeholder="E.g. 4"
            />
          </FormField>
          <FormField label="Skills" htmlFor="skills" className="sm:col-span-2">
            <TagInput
              id="skills"
              name="skills"
              placeholder="Add a skill"
              initialTags={profile.skills}
            />
          </FormField>
          <FormField
            label="Industries Worked In (Optional)"
            htmlFor="industries"
            className="sm:col-span-2"
          >
            <TagInput
              id="industries"
              name="industries"
              placeholder="E.g. FinTech, Healthcare"
              initialTags={profile.industries}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Work Experience"
        action={
          canAddRole && (
            <button
              type="button"
              onClick={addRole}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
            >
              <Plus className="size-4" />
              Add role
            </button>
          )
        }
      >
        {roles.length === 0 ? (
          <p className="text-sm text-text-muted">
            No roles yet. Add up to {MAX_WORK_EXPERIENCE_ROLES} of your most
            recent positions.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {roles.map((entry, index) => (
              <WorkExperienceCard
                key={entry.key}
                index={index}
                role={entry.role}
                onRemove={
                  roles.length > 1 ? () => removeRole(entry.key) : undefined
                }
              />
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Education">
        <div className={GRID_CLASSES}>
          <FormField label="Highest Degree" htmlFor="education.degree">
            <SelectInput
              id="education.degree"
              name="education.degree"
              options={DEGREE_OPTIONS}
              defaultValue={profile.education?.degree ?? null}
            />
          </FormField>
          <FormField label="Field of Study" htmlFor="education.field_of_study">
            <TextInput
              id="education.field_of_study"
              name="education.field_of_study"
              defaultValue={profile.education?.field_of_study ?? ""}
              placeholder="E.g. Computer Science"
            />
          </FormField>
          <FormField label="Institution Name" htmlFor="education.institution">
            <TextInput
              id="education.institution"
              name="education.institution"
              defaultValue={profile.education?.institution ?? ""}
              placeholder="E.g. State University"
            />
          </FormField>
          <FormField
            label="Graduation Year"
            htmlFor="education.graduation_year"
          >
            <TextInput
              id="education.graduation_year"
              name="education.graduation_year"
              inputMode="numeric"
              maxLength={4}
              defaultValue={profile.education?.graduation_year ?? ""}
              placeholder="YYYY"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Job Preferences">
        <div className={GRID_CLASSES}>
          <FormField
            label="Job Titles Seeking"
            htmlFor="job_titles_seeking"
            className="sm:col-span-2"
          >
            <TextInput
              id="job_titles_seeking"
              name="job_titles_seeking"
              defaultValue={profile.job_titles_seeking.join(", ")}
              placeholder="E.g. Frontend Engineer, React Developer"
            />
          </FormField>
          <FormField label="Remote Preference" htmlFor="remote_preference">
            <SelectInput
              id="remote_preference"
              name="remote_preference"
              options={REMOTE_PREFERENCE_OPTIONS}
              defaultValue={profile.remote_preference}
            />
          </FormField>
          <FormField
            label="Salary Expectation (Optional)"
            htmlFor="salary_expectation"
          >
            <TextInput
              id="salary_expectation"
              name="salary_expectation"
              defaultValue={profile.salary_expectation ?? ""}
              placeholder="E.g. $120k+"
            />
          </FormField>
          <FormField
            label="Preferred Locations (Optional)"
            htmlFor="preferred_locations"
            className="sm:col-span-2"
          >
            <TextInput
              id="preferred_locations"
              name="preferred_locations"
              defaultValue={profile.preferred_locations.join(", ")}
              placeholder="E.g. New York, London"
            />
          </FormField>
        </div>
      </FormSection>

      <div className="border-t border-border pt-8">
        {result && !isSaving && (
          <ResultMessage
            success={result.success}
            message={
              result.success
                ? "Profile saved."
                : (result.error ?? "We couldn’t save your profile.")
            }
            className="mb-4"
          />
        )}
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving && <LoaderCircle className="size-4 animate-spin" />}
          {isSaving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
