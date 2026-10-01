import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  aside,
  className,
  children,
}: Props) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold tracking-[0.04em] text-text-medium uppercase"
        >
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}
