import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "className"> & {
  // "auto" is white while empty and grey once filled, as on the page card.
  // "surface" stays white, for inputs sitting on a grey panel.
  fill?: "auto" | "surface";
};

const FILL_CLASSES = {
  auto: "bg-surface-secondary placeholder-shown:bg-surface placeholder-shown:shadow-xs",
  surface: "bg-surface shadow-xs",
};

export function TextInput({ fill = "auto", ...inputProps }: Props) {
  return (
    <input
      {...inputProps}
      className={`h-[42px] w-full rounded-md border border-border px-4 text-sm text-text-darkest outline-none transition-colors placeholder:text-text-muted read-only:text-text-secondary focus:border-accent focus:ring-1 focus:ring-accent disabled:bg-background disabled:text-text-muted disabled:shadow-none ${FILL_CLASSES[fill]}`}
    />
  );
}
