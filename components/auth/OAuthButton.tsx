import type { ReactNode } from "react";

import { signInWithProvider } from "@/actions/auth";
import { OAuthSubmitButton } from "@/components/auth/OAuthSubmitButton";
import type { OAuthProvider } from "@/types";

type Props = {
  provider: OAuthProvider;
  label: string;
  icon: ReactNode;
};

export function OAuthButton({ provider, label, icon }: Props) {
  return (
    <form action={signInWithProvider.bind(null, provider)}>
      <OAuthSubmitButton label={label} icon={icon} />
    </form>
  );
}
