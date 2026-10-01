import { Building2, Search } from "lucide-react";

type Props = {
  company: string;
};

export function CompanyResearch({ company }: Props) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-muted">
            <Building2 className="size-4 text-accent" />
          </span>
          <h2 className="text-base font-semibold text-text-primary">
            Company Research
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Search className="size-4" />
          Research Company
        </button>
      </div>
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface-secondary">
          <Building2 className="size-6 text-text-muted" />
        </span>
        <p className="mt-4 text-sm font-medium text-text-primary">
          No research yet
        </p>
        <p className="mt-1 max-w-[320px] text-sm text-text-muted">
          Click “Research Company” to let the AI browse {company}’s public
          pages and build a dossier.
        </p>
      </div>
    </section>
  );
}
