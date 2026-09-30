import { BottomCta } from "@/components/homepage/BottomCta";
import { DashboardPreview } from "@/components/homepage/DashboardPreview";
import { Features } from "@/components/homepage/Features";
import { HatchDivider } from "@/components/homepage/HatchDivider";
import { Hero } from "@/components/homepage/Hero";
import { HomeNavbar } from "@/components/homepage/HomeNavbar";
import { Testimonial } from "@/components/homepage/Testimonial";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="flex-1 bg-surface">
      <HomeNavbar />
      <div className="px-4 xl:px-0">
        <main className="mx-auto mt-[60px] max-w-[1280px] border-x border-border-light">
          <Hero />
          <DashboardPreview />
          <div aria-hidden className="h-[73px]" />
          <Features />
          <HatchDivider />
          <Testimonial />
          <HatchDivider />
          <BottomCta />
          <HatchDivider />
          <Footer />
        </main>
      </div>
    </div>
  );
}
