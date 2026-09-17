"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import type { Strategy } from "@/lib/ai/schemas";

export function AIStrategyPanel({ initial }: { initial: Strategy | null }) {
  const [strategy, setStrategy] = useState<Strategy | null>(initial);
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/strategy", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      return;
    }
    setStrategy(data.insight.content);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> AI Strategy
          </CardTitle>
          <CardDescription>Observed positioning and angle patterns across your tracked competitors.</CardDescription>
        </div>
        <Button size="sm" variant={strategy ? "outline" : "default"} onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : strategy ? <RefreshCw className="h-4 w-4" /> : null}
          {strategy ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      {strategy && (
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-muted-foreground">{strategy.summary}</p>
            <ConfidenceBadge level={strategy.confidence} className="shrink-0" />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common angles</p>
            <div className="flex flex-wrap gap-1.5">
              {strategy.commonAngles.map((a) => (
                <Badge key={a} variant="outline">{a.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{strategy.priceRangeObservation}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ListBlock title="Differentiation opportunities" items={strategy.differentiationOpportunities} />
            <ListBlock title="Weaknesses observed" items={strategy.weaknessesObserved} />
            <ListBlock title="Questions to investigate" items={strategy.questionsToInvestigate} />
            <ListBlock title="Observed positioning" items={strategy.observedPositioning} />
          </div>
        </CardContent>
      )}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="AI analyses" />
    </Card>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted-foreground">{item}</li>
        ))}
      </ul>
    </div>
  );
}
