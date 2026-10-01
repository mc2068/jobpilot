import { ChevronDown } from "lucide-react";

type Option<Value extends string> = {
  value: Value;
  label: string;
};

type Props<Value extends string> = {
  name: string;
  label: string;
  options: Option<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

export function FilterSelect<Value extends string>({
  name,
  label,
  options,
  value,
  onChange,
}: Props<Value>) {
  const handleChange = (selected: string): void => {
    const option = options.find((item) => item.value === selected);

    if (option) {
      onChange(option.value);
    }
  };

  return (
    <div className="relative">
      <select
        name={name}
        aria-label={label}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="h-8 w-full appearance-none rounded-md border border-border bg-surface pr-9 pl-3 text-sm font-medium text-text-darkest shadow-xs outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-secondary" />
    </div>
  );
}
