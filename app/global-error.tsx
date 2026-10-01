"use client";

import { useEffect } from "react";

import { inter } from "@/app/fonts";
import { captureException } from "@/lib/posthog-client";
import "./globals.css";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Next.js requires a default export here, and this file replaces the root
// layout while active, so it brings its own document, styles and font.
export default function GlobalError({ error, retry }: Props) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-4 py-16">
        <title>Something went wrong · JobPilot</title>
        <main className="w-full max-w-[400px] rounded-xl border border-border bg-surface px-6 py-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            An unexpected error stopped this page from loading. Please try
            again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
