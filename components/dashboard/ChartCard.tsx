import type { ReactNode } from "react";

type Props = {
  title: string;
  className?: string;
  children: ReactNode;
};

export function ChartCard({ title, className = "", children }: Props) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-xl border border-border bg-surface p-6 shadow-sm ${className}`}
    >
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {/* mt-auto: in a card stretched by its row, the chart sits at the bottom */}
      <div className="mt-auto pt-6">{children}</div>
    </section>
  );
}
