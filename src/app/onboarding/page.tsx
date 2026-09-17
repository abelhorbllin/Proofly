"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Store, Target, Globe2, Compass } from "lucide-react";

const BUSINESS_TYPES = [
  { value: "DROPSHIPPING", label: "Dropshipping" },
  { value: "SHOPIFY_BRAND", label: "Shopify brand" },
  { value: "DTC", label: "DTC brand" },
  { value: "AGENCY", label: "Agency" },
  { value: "OTHER", label: "Other" },
] as const;

const MARKETS = [
  { value: "FRANCE", label: "France" },
  { value: "EUROPE", label: "Europe" },
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "WORLDWIDE", label: "Worldwide" },
] as const;

const GOALS = [
  { value: "FIND_OPPORTUNITIES", label: "Find opportunities" },
  { value: "VALIDATE_PRODUCTS", label: "Validate products" },
  { value: "ANALYZE_COMPETITORS", label: "Analyze competitors" },
  { value: "ANALYZE_ADS", label: "Analyze ads" },
  { value: "MONITOR_COMPETITORS", label: "Monitor competitors" },
] as const;

const STEPS = [
  { key: "businessType", title: "What type of business do you have?", icon: Store },
  { key: "mainMarket", title: "What's your main market?", icon: Globe2 },
  { key: "mainGoal", title: "What's your main goal?", icon: Target },
  { key: "storeUrl", title: "Have a store already? (optional)", icon: Compass },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [mainMarket, setMainMarket] = useState<string | null>(null);
  const [mainGoal, setMainGoal] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState("");

  const current = STEPS[step];
  const Icon = current.icon;

  function canAdvance() {
    if (current.key === "businessType") return !!businessType;
    if (current.key === "mainMarket") return !!mainMarket;
    if (current.key === "mainGoal") return !!mainGoal;
    return true;
  }

  async function finish() {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType, mainMarket, mainGoal, storeUrl: storeUrl || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent)]" />
      <Card className="relative z-10 w-full max-w-lg animate-slide-up">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Welcome to ADINTEL
            <span className="ml-auto">
              Step {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.key} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-surface-2")} />
            ))}
          </div>
          <CardTitle className="mt-4 flex items-center gap-2 text-xl">
            <Icon className="h-5 w-5 text-primary" />
            {current.title}
          </CardTitle>
          <CardDescription>This helps us tailor your dashboard from the first login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {current.key === "businessType" && (
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((opt) => (
                <OptionButton key={opt.value} label={opt.label} selected={businessType === opt.value} onClick={() => setBusinessType(opt.value)} />
              ))}
            </div>
          )}
          {current.key === "mainMarket" && (
            <div className="grid grid-cols-2 gap-2">
              {MARKETS.map((opt) => (
                <OptionButton key={opt.value} label={opt.label} selected={mainMarket === opt.value} onClick={() => setMainMarket(opt.value)} />
              ))}
            </div>
          )}
          {current.key === "mainGoal" && (
            <div className="grid grid-cols-1 gap-2">
              {GOALS.map((opt) => (
                <OptionButton key={opt.value} label={opt.label} selected={mainGoal === opt.value} onClick={() => setMainGoal(opt.value)} />
              ))}
            </div>
          )}
          {current.key === "storeUrl" && (
            <div className="space-y-1.5">
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input
                id="storeUrl"
                placeholder="yourstore.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll run your first analysis immediately after onboarding so you can see ADINTEL in action.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </Button>
            <Button size="sm" disabled={!canAdvance() || loading} onClick={next}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {step === STEPS.length - 1 ? "Go to dashboard" : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
