import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getProfileCompletion } from "@/lib/profile-completion";
import { LOGIN_PATH } from "@/lib/routes";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Profile · JobPilot",
};

async function loadProfile(): Promise<Profile | null> {
  const insforge = await createInsforgeServer();
  const { data: auth, error: authError } = await insforge.auth.getCurrentUser();
  const user = auth?.user;

  if (authError || !user) {
    redirect(LOGIN_PATH);
  }

  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    console.error("[profile/page]", error);
    return null;
  }

  return data;
}

export default async function ProfilePage() {
  const profile = await loadProfile();
  const completion = profile ? getProfileCompletion(profile) : null;

  return (
    <>
      <Navbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[936px] flex-col gap-8">
          {profile && completion ? (
            <>
              {completion.percent < 100 && (
                <CompletionIndicator completion={completion} />
              )}
              <ProfileWorkspace profile={profile} />
            </>
          ) : (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-border bg-surface p-8 text-sm text-text-dark shadow-sm"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-error" />
              We couldn’t load your profile. Please refresh the page or sign in
              again.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
