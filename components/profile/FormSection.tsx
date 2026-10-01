import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FormSection({ title, action, children }: Props) {
  return (
    <section className="border-t border-border py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
