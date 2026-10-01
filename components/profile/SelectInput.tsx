import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  id: string;
  name: string;
  options: Option[];
  defaultValue: string | null;
};

export function SelectInput({ id, name, options, defaultValue }: Props) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-[42px] w-full appearance-none rounded-md border border-border bg-surface pr-10 pl-4 text-sm text-text-darkest shadow-xs outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text-secondary" />
    </div>
  );
}
