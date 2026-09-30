import Image from "next/image";

import { FeatureSection } from "@/components/homepage/FeatureSection";
import { HatchDivider } from "@/components/homepage/HatchDivider";

const DISCOVERY_FEATURES = [
  {
    title: "Find jobs that actually fit",
    description:
      "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
  },
  {
    title: "Know the Company Before You Apply",
    description:
      "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
  },
  {
    title: "Keep track of every application",
    description:
      "Keep a clear view of every job you’ve found, tailored. Your activity and progress all stay in one simple place.",
  },
];

const MATCHING_FEATURES = [
  {
    title: "Understand your match score",
    description:
      "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what’s missing.",
  },
  {
    title: "AI-Powered Job Matching",
    description:
      "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
  },
  {
    title: "Focus on the right roles",
    description:
      "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
  },
];

export function Features() {
  return (
    <>
      <FeatureSection
        title="Manage Your Job Search With Ease"
        features={DISCOVERY_FEATURES}
        activeIndex={0}
        activeTone="accent"
        mediaSide="right"
        media={
          <Image
            src="/images/jobs-lists.png"
            alt="Job list with company, match score, salary estimate and source"
            width={591}
            height={444}
            className="h-auto w-full max-w-[591px]"
          />
        }
      />
      <HatchDivider />
      <FeatureSection
        title="Apply With More Confidence, Every Time"
        features={MATCHING_FEATURES}
        activeIndex={1}
        activeTone="success"
        mediaSide="left"
        media={
          <Image
            src="/images/agnet-log.png"
            alt="Agent log showing JobPilot scanning and filtering roles"
            width={536}
            height={414}
            className="h-auto w-full max-w-[536px]"
          />
        }
      />
    </>
  );
}
