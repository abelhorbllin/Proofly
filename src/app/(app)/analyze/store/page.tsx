"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AnalysisProgress, type ProgressStepState } from "@/components/adintel/analysis-progress";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Search, Loader2 } from "lucide-react";
import { STORE_ANALYSIS_STEPS } from "@/lib/analysis/generate-store-analysis";

export default function AnalyzeStorePage() {
  return (
    <Suspense>
      <AnalyzeStoreForm />
    </Suspense>
  );
}

function AnalyzeStoreForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [steps, setSteps] = useState<ProgressStepState[]>(
    STORE_ANALYSIS_STEPS.map((s) => ({ ...s, status: "pending" }))
  );

  async function runAnalysis(targetUrl: string) {
    setAnalyzing(true);
    setError(null);
    setSteps(STORE_ANALYSIS_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));

    // Simulated step progression for UX while the request is in flight —
    // the actual work happens server-side in one job, per spec section 48.
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex += 1;
      if (stepIndex < STORE_ANALYSIS_STEPS.length) {
        setSteps((prev) =>
          prev.map((s, i) => ({ ...s, status: i < stepIndex ? "done" : i === stepIndex ? "active" : "pending" }))
        );
      }
    }, 700);

    try {
      const res = await fetch("/api/analyze/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      clearInterval(interval);

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "USAGE_LIMIT") {
          setUpgradeOpen(true);
          setAnalyzing(false);
          return;
        }
        setError(data.error ?? "Something went wrong.");
        setAnalyzing(false);
        return;
      }

      setSteps(STORE_ANALYSIS_STEPS.map((s) => ({ ...s, status: "done" })));
      setTimeout(() => router.push(`/stores/${data.storeId}`), 400);
    } catch {
      clearInterval(interval);
      setError("Network error. Please try again.");
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get("url");
    if (initial) runAnalysis(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze a store</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a competitor store URL. ADINTEL retrieves products, ads, traffic and revenue estimates from
          supported public sources.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store URL</CardTitle>
          <CardDescription>e.g. competitorstore.com</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim() && !analyzing) runAnalysis(url.trim());
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="competitorstore.com" className="pl-9" disabled={analyzing} />
            </div>
            <Button type="submit" disabled={analyzing || !url.trim()}>
              {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
              Analyze
            </Button>
          </form>
          {error && <p className="text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {analyzing && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Analysis in progress...</Label>
          <AnalysisProgress steps={steps} />
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="store analyses" />
    </div>
  );
}
