import Link from "next/link";
import {
  ArrowRight,
  Search,
  Megaphone,
  ShieldCheck,
  Swords,
  Sparkles,
  Bell,
  History,
  TrendingUp,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingSection } from "@/components/marketing/pricing-section";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";

const HOW_IT_WORKS = [
  { step: "01", title: "Enter a store or product", description: "Paste a competitor's URL, a product page, or a product idea you found elsewhere." },
  { step: "02", title: "ADINTEL gathers evidence", description: "We pull observed and estimated signals — ads, products, traffic, pricing — from supported public sources." },
  { step: "03", title: "Review structured evidence", description: "Every metric ships with a range, a confidence level, and a methodology — never a bare number presented as fact." },
  { step: "04", title: "Validate before you spend", description: "Combine market, ad and economic signals into one validation report before testing an idea." },
];

const FEATURES = [
  {
    icon: Search,
    title: "Store analysis",
    description: "Understand a competitor's products, advertising activity, traffic and estimated revenue in one place.",
  },
  {
    icon: Megaphone,
    title: "Ad intelligence",
    description: "Browse a structured ad library with AI-assisted hook, offer and CTA analysis for every creative.",
  },
  {
    icon: ShieldCheck,
    title: "Product validation",
    description: "Combine market signals, competitor activity and unit economics into one validation report.",
  },
  {
    icon: Swords,
    title: "Competitor comparison",
    description: "Compare your store against a competitor's observed signals — no arbitrary winner, just differences.",
  },
  {
    icon: Sparkles,
    title: "AI analysis",
    description: "AI interprets the evidence ADINTEL gathers — it never guarantees outcomes or invents data.",
  },
  {
    icon: Bell,
    title: "Alerts",
    description: "Track competitors and get notified the moment a new ad, product or price change is detected.",
  },
  {
    icon: History,
    title: "Historical tracking",
    description: "See how a competitor's ads, products and pricing evolved over time on a visual timeline.",
  },
  {
    icon: TrendingUp,
    title: "Revenue simulator",
    description: "Model traffic, conversion and AOV assumptions to see how they translate into estimated revenue.",
  },
];

const FAQS = [
  {
    q: "Is the data on ADINTEL guaranteed to be accurate?",
    a: "No. ADINTEL clearly separates observed facts from modeled estimates. Every estimated metric shows a range, a confidence level and the methodology used, and we never present an estimate as a verified fact.",
  },
  {
    q: "Does ADINTEL bypass logins, paywalls or platform security?",
    a: "No. ADINTEL only uses publicly available information, authorized APIs, licensed data providers, and data you provide yourself.",
  },
  {
    q: "What happens if there isn't enough public data?",
    a: "We say so explicitly — you'll see \"Insufficient public data\" or \"Unable to estimate reliably\" instead of a fabricated number.",
  },
  {
    q: "Is ADINTEL a product-finding tool?",
    a: "No — discovery is a secondary, optional feature. ADINTEL's core purpose is validating a product or store you've already found elsewhere.",
  },
  {
    q: "Can I track competitors over time?",
    a: "Yes. Add a competitor to tracking and ADINTEL monitors new ads, products, price changes and creative changes, surfacing them as alerts.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from Settings → Billing. Your plan remains active until the end of the current billing period.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_20%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Evidence-based e-commerce validation
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Don&apos;t just find products.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Validate them.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Analyze competitors, monitor their ads, estimate business performance, and validate your next e-commerce
            opportunity before spending money testing it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start validating <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Hero visual: realistic dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <Card className="overflow-hidden border-border/80 shadow-2xl">
            <CardContent className="p-0">
              <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-muted-foreground">app.adintel.com/stores/lumoglow</span>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-4">
                <HeroMetric label="Estimated revenue" value="€45K–€72K" badge="MEDIUM" />
                <HeroMetric label="Active ads" value="18" badge="HIGH" />
                <HeroMetric label="Estimated traffic" value="210K–280K" badge="LOW" />
                <HeroMetric label="Competitors tracked" value="6" badge="HIGH" />
              </div>
              <div className="grid gap-4 border-t border-border p-6 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface-2 p-4 sm:col-span-2">
                  <p className="mb-3 text-xs font-medium text-muted-foreground">Validation signals</p>
                  <div className="space-y-2.5">
                    <SignalRow label="Advertising activity" level="STRONG" />
                    <SignalRow label="Competitor density" level="MEDIUM" />
                    <SignalRow label="Creative diversity" level="MEDIUM" />
                    <SignalRow label="Estimated margin" level="STRONG" />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" /> AI insight
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    &ldquo;Observed signals suggest strong, sustained advertising activity. Confidence is limited by
                    modeled traffic estimates — verify unit economics before testing.&rdquo;
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-danger">The problem</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Most product testing is a guess that costs €500–€2,000
            </h2>
            <p className="mt-3 text-muted-foreground">
              You find a product on TikTok or a spy tool, launch ads, and hope. Without evidence on competition, ad
              activity, or margins, testing is expensive trial and error.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">The solution</p>
            <h2 className="text-2xl font-semibold tracking-tight">Evidence before spend, not after</h2>
            <p className="mt-3 text-muted-foreground">
              ADINTEL gathers observed and estimated signals — ads, traffic, pricing, competition — into one
              validation report, so you decide with evidence instead of hope.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-surface/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">From a URL to a validation decision in four steps.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-2xl font-semibold text-primary/60">{s.step}</p>
                <p className="mt-3 text-sm font-medium">{s.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Everything needed to validate, not just discover</h2>
          <p className="mt-3 text-muted-foreground">Every module answers one question: what does this evidence mean for my decision?</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Transparency callout */}
      <section className="border-t border-border bg-surface/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <ConfidenceBadge level="MEDIUM" className="mb-4" />
          <h2 className="text-3xl font-semibold tracking-tight">Estimates are never presented as facts</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Every estimated metric on ADINTEL shows a range, a confidence level, a data source and the methodology
            behind it. When public data is insufficient, we say so — instead of inventing a number.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            {["Observed", "Estimated", "AI analysis"].map((label) => (
              <div key={label} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you need more analyses.</p>
        </div>
        <PricingSection />
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-surface/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-medium">{f.q}</p>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_15%,transparent),transparent)]" />
          <div className="relative">
            <Activity className="mx-auto mb-4 h-8 w-8 text-primary" />
            <h2 className="text-3xl font-semibold tracking-tight">Stop guessing. Start validating.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Your next product test deserves evidence, not hope. Get started free — no credit card required.
            </p>
            <Button size="lg" className="mt-6" asChild>
              <Link href="/signup">
                Start validating <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function HeroMetric({ label, value, badge }: { label: string; value: string; badge: "LOW" | "MEDIUM" | "HIGH" }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <ConfidenceBadge level={badge} className="px-1.5 py-0 text-[9px]" />
      </div>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SignalRow({ label, level }: { label: string; level: "WEAK" | "MEDIUM" | "STRONG" }) {
  const color = level === "STRONG" ? "bg-success" : level === "MEDIUM" ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        {level}
      </span>
    </div>
  );
}
