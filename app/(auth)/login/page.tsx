import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { HOME_PATH, OAUTH_ERROR } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Sign in · JobPilot",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const hasError = error === OAUTH_ERROR;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-hero-glow px-4 py-16">
      <Link href={HOME_PATH} aria-label="JobPilot home">
        <Image
          src="/logo.png"
          alt="JobPilot"
          width={124}
          height={42}
          loading="eager"
        />
      </Link>

      <div className="mt-8 w-full max-w-[400px] rounded-xl border border-border bg-surface px-6 py-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-[-0.02em] text-text-primary">
          Welcome to JobPilot
        </h1>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Sign in or create an account to start finding matches.
        </p>

        {hasError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2.5 text-sm text-text-dark"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
            We couldn’t sign you in. Please try again.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <OAuthButton
            provider="google"
            label="Continue with Google"
            icon={<GoogleIcon />}
          />
          <OAuthButton
            provider="github"
            label="Continue with GitHub"
            icon={<GitHubIcon />}
          />
        </div>
      </div>
    </main>
  );
}
