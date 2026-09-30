import { BottomCta } from "@/components/homepage/BottomCta";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Features } from "@/components/homepage/Features";
import { HatchDivider } from "@/components/homepage/HatchDivider";
import { Hero } from "@/components/homepage/Hero";
import { HomeNavbar } from "@/components/homepage/HomeNavbar";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";
import { hasSession } from "@/lib/insforge-server";

export default async function HomePage() {
  const ctaHref = (await hasSession()) ? "/dashboard" : "/login";

  return (
    <div className="flex-1 bg-surface">
      <HomeNavbar ctaHref={ctaHref} />
      <div className="px-4 xl:px-0">
        <main className="mx-auto mt-[60px] max-w-[1280px] border-x border-border-light">
          <Hero ctaHref={ctaHref} />
          <DashboardPreview />
          <div aria-hidden className="h-[73px]" />
          <Features />
          <HatchDivider />
          <Testimonial />
          <HatchDivider />
          <BottomCta ctaHref={ctaHref} />
          <HatchDivider />
          <Footer />
        </main>
      </div>
    </div>
  );
}
