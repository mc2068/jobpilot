"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { captureEvent } from "@/lib/posthog-client";
import type { OAuthProvider } from "@/types";

type Props = {
  provider: OAuthProvider;
  label: string;
  icon: ReactNode;
};

// Disabling while pending matters: a second click would start a new OAuth
// flow and overwrite the code verifier cookie the first flow depends on.
export function OAuthSubmitButton({ provider, label, icon }: Props) {
  const { pending } = useFormStatus();

  const handleClick = () => {
    captureEvent("oauth_sign_in_started", { provider }, true);
  };

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={handleClick}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin text-text-muted" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}
