import type { Metadata } from "next";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingSection } from "@/components/marketing/pricing-section";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for ADINTEL. Start free, upgrade when you need more analyses.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more analyses. Cancel anytime.</p>
        </div>
        <PricingSection />
      </section>
      <MarketingFooter />
    </div>
  );
}
