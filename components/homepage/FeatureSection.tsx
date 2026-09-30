import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
};

type Props = {
  title: string;
  features: Feature[];
  activeIndex: number;
  activeTone: "accent" | "success";
  media: ReactNode;
  mediaSide: "left" | "right";
};

const ACTIVE_BORDER = {
  accent: "border-solid border-accent-dark",
  success: "border-solid border-success-dark",
};

export function FeatureSection({
  title,
  features,
  activeIndex,
  activeTone,
  media,
  mediaSide,
}: Props) {
  const mediaOnRight = mediaSide === "right";

  return (
    <section className="grid border-y border-border-light lg:h-[688px] lg:grid-cols-2">
      <div
        className={`flex flex-col ${mediaOnRight ? "lg:border-r lg:border-border-light" : "lg:order-2"}`}
      >
        <div className="ml-6 flex items-center border-l border-dashed border-border-light px-6 py-12 lg:ml-12 lg:h-56 lg:py-0">
          <h2 className="max-w-[520px] text-4xl leading-[1.08] font-semibold tracking-[-0.02em] text-text-slate lg:text-5xl">
            {title}
          </h2>
        </div>

        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="flex border-t border-border-light lg:flex-1"
          >
            <div
              className={`ml-6 flex flex-1 flex-col justify-center gap-2 border-l py-8 pr-[22px] pl-6 lg:ml-12 lg:py-0 ${
                index === activeIndex
                  ? ACTIVE_BORDER[activeTone]
                  : "border-dashed border-border-light"
              }`}
            >
              <h3 className="text-xl leading-7 font-semibold text-text-darker">
                {feature.title}
              </h3>
              <p className="text-lg leading-[30px] text-text-slate-medium">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`flex items-center justify-center bg-background px-6 py-12 lg:py-0 ${mediaOnRight ? "" : "lg:order-1"}`}
      >
        {media}
      </div>
    </section>
  );
}
