import { CtaButtons } from "@/components/homepage/CtaButtons";

type Props = {
  ctaHref: string;
};

export function BottomCta({ ctaHref }: Props) {
  return (
    <section className="border-y border-border-light bg-hero-glow px-6 py-20 text-center">
      <h2 className="mx-auto max-w-[780px] text-4xl font-bold tracking-[-0.04em] text-text-slate sm:text-5xl lg:text-[58px] lg:leading-[58px]">
        Your next job search can feel a lot less overwhelming
      </h2>
      <p className="mt-[30px] text-lg leading-7 text-text-darker">
        Set up your profile, upload your resume, and start finding matches in
        minutes.
      </p>
      <div className="mt-7">
        <CtaButtons primaryHref={ctaHref} />
      </div>
    </section>
  );
}
