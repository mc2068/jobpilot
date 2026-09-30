import Image from "next/image";

export function DashboardPreview() {
  return (
    <section className="border-b border-border-light bg-background px-4 pt-[27px] pb-3">
      <Image
        src="/images/dashboard-demo.png"
        alt="JobPilot dashboard showing job stats, recent activity and company research charts"
        width={1197}
        height={604}
        loading="eager"
        fetchPriority="high"
        className="mx-auto h-auto w-full max-w-[1197px]"
      />
    </section>
  );
}
