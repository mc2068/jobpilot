import Image from "next/image";

export function Testimonial() {
  return (
    <section className="border-b border-border-light px-6 pt-[47px] pb-[52px] text-center">
      <p className="text-sm font-medium tracking-[0.08em] text-accent-dark uppercase">
        Success stories
      </p>
      <figure className="mt-5">
        <blockquote className="mx-auto max-w-[860px] text-2xl leading-snug font-medium text-text-darker lg:text-[32px] lg:leading-[44px]">
          “I used to spend my evenings copy-pasting resumes. Now I open my
          dashboard to see interviews waiting. It feels like cheating. Had 3
          offers on the table simultaneously.”
        </blockquote>
        <figcaption className="mt-[21px] inline-flex items-center gap-3 text-left">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={48}
            height={48}
            className="rounded-md"
          />
          <span>
            <span className="block text-base font-semibold text-text-black">
              Tom Wilson
            </span>
            <span className="mt-[5px] block text-sm text-text-slate-medium">
              Junior Developer
            </span>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
