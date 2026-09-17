"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdAnalysisData {
  summary: string;
  hookAnalysis: string | null;
  visualAnalysis: string | null;
  offerAnalysis: string | null;
  ctaAnalysis: string | null;
  audienceHypothesis: string | null;
  angleClassification: string | null;
  strengths: string[];
  weaknesses: string[];
  objections: string[];
  improvements: string[];
  testingIdeas: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export function AIAdAnalysis({ creativeId, initial }: { creativeId: string; initial: AdAnalysisData | null }) {
  const [analysis, setAnalysis] = useState<AdAnalysisData | null>(initial);
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/ad-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creativeId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      return;
    }
    setAnalysis(data.analysis);
  }

  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center">
        <Sparkles className="mx-auto mb-3 h-5 w-5 text-primary" />
        <p className="text-sm font-medium">Generate AI creative analysis</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          AI will interpret the hook, visual, offer and CTA based only on this ad&apos;s observed data.
        </p>
        <Button size="sm" className="mt-4" onClick={run} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Analyze creative
        </Button>
        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="AI analyses" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        <div className="flex shrink-0 items-center gap-2">
          {analysis.angleClassification && <Badge variant="secondary">{analysis.angleClassification.replace(/_/g, " ")}</Badge>}
          <ConfidenceBadge level={analysis.confidence} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AnalysisRow label="Hook" text={analysis.hookAnalysis} />
        <AnalysisRow label="Visual" text={analysis.visualAnalysis} />
        <AnalysisRow label="Offer" text={analysis.offerAnalysis} />
        <AnalysisRow label="CTA" text={analysis.ctaAnalysis} />
        <AnalysisRow label="Audience hypothesis" text={analysis.audienceHypothesis} className="sm:col-span-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BulletList title="Potential strengths" items={analysis.strengths} tone="success" />
        <BulletList title="Potential weaknesses" items={analysis.weaknesses} tone="warning" />
        <BulletList title="Potential objections" items={analysis.objections} tone="danger" />
        <BulletList title="Improvement ideas" items={analysis.improvements} tone="info" />
      </div>

      {analysis.testingIdeas.length > 0 && <BulletList title="Testing ideas" items={analysis.testingIdeas} tone="primary" />}
    </div>
  );
}

function AnalysisRow({ label, text, className }: { label: string; text: string | null; className?: string }) {
  if (!text) return null;
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}

function BulletList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" | "danger" | "info" | "primary" }) {
  const dotClass = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", primary: "bg-primary" }[tone];
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
