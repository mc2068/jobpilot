import type { ComponentProps, ReactNode } from "react";

type Props = Omit<ComponentProps<"input">, "className"> & {
  // "auto" is white while empty and grey once filled, as on the page card.
  // "surface" stays white, for inputs sitting on a grey panel.
  fill?: "auto" | "surface";
  icon?: ReactNode;
};

const FILL_CLASSES = {
  auto: "bg-surface-secondary placeholder-shown:bg-surface placeholder-shown:shadow-xs",
  surface: "bg-surface shadow-xs",
};

export function TextInput({ fill = "auto", icon, ...inputProps }: Props) {
  const input = (
    <input
      {...inputProps}
      className={`h-[42px] w-full rounded-md border border-border text-sm text-text-darkest outline-none transition-colors placeholder:text-text-muted read-only:text-text-secondary focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-background disabled:text-text-muted disabled:shadow-none ${icon ? "pr-4 pl-9" : "px-4"} ${FILL_CLASSES[fill]}`}
    />
  );

  if (!icon) {
    return input;
  }

  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
        {icon}
      </span>
    </div>
  );
}
