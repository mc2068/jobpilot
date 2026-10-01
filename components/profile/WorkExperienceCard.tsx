"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { FormField } from "@/components/profile/FormField";
import { TextInput } from "@/components/profile/TextInput";
import type { WorkExperience } from "@/types";

type Props = {
  index: number;
  role: WorkExperience;
  onRemove?: () => void;
};

export function WorkExperienceCard({ index, role, onRemove }: Props) {
  const [isCurrent, setIsCurrent] = useState(role.is_current);
  const fieldName = (field: keyof WorkExperience): string =>
    `work_experience.${index}.${field}`;

  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-5">
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <FormField label="Company Name" htmlFor={fieldName("company")}>
          <TextInput
            id={fieldName("company")}
            name={fieldName("company")}
            defaultValue={role.company}
            placeholder="E.g. Acme Inc."
            fill="surface"
          />
        </FormField>
        <FormField label="Job Title" htmlFor={fieldName("title")}>
          <TextInput
            id={fieldName("title")}
            name={fieldName("title")}
            defaultValue={role.title}
            placeholder="E.g. Frontend Engineer"
            fill="surface"
          />
        </FormField>
        <FormField label="Start Date" htmlFor={fieldName("start_date")}>
          <TextInput
            id={fieldName("start_date")}
            name={fieldName("start_date")}
            type="month"
            defaultValue={role.start_date}
            fill="surface"
          />
        </FormField>
        <FormField
          label="End Date"
          htmlFor={fieldName("end_date")}
          aside={
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-dark">
              <input
                type="checkbox"
                name={fieldName("is_current")}
                checked={isCurrent}
                onChange={(event) => setIsCurrent(event.target.checked)}
                className="size-3.5 accent-accent"
              />
              Currently working here
            </label>
          }
        >
          <TextInput
            id={fieldName("end_date")}
            name={fieldName("end_date")}
            type="month"
            defaultValue={role.end_date ?? ""}
            disabled={isCurrent}
            fill="surface"
          />
        </FormField>
        <FormField
          label="Key Responsibilities"
          htmlFor={fieldName("responsibilities")}
          className="sm:col-span-2"
        >
          <textarea
            id={fieldName("responsibilities")}
            name={fieldName("responsibilities")}
            defaultValue={role.responsibilities}
            placeholder="What you built, owned and improved in this role."
            rows={3}
            className="block w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-text-darkest shadow-xs outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </FormField>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-error"
        >
          <Trash2 className="size-4" />
          Remove role
        </button>
      )}
    </div>
  );
}
