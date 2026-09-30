import { CtaButtons } from "@/components/homepage/CtaButtons";

type Props = {
  ctaHref: string;
};

export function Hero({ ctaHref }: Props) {
  return (
    <section className="border-y border-border-light bg-hero-glow px-6 pt-[59px] pb-16 text-center">
      <h1 className="text-[32px] leading-tight font-bold tracking-[-0.02em] text-text-black sm:text-5xl lg:text-[64px] lg:leading-[72px]">
        <span className="block">Job hunting is hard.</span>
        <span className="block">Your tools shouldn’t be.</span>
      </h1>
      <p className="mx-auto mt-4.5 max-w-[620px] text-lg leading-[30px] tracking-[-0.015em] text-text-slate-medium">
        Stop applying blind. JobPilot finds the jobs, researches the companies,
        and gives you everything you need to stand out.
      </p>
      <div className="mt-[23px]">
        <CtaButtons primaryHref={ctaHref} />
      </div>
    </section>
  );
}
