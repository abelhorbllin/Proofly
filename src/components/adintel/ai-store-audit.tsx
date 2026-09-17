"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Sparkles, Loader2 } from "lucide-react";
import type { StoreAudit } from "@/lib/ai/schemas";

export function AIStoreAudit({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<StoreAudit | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch("/api/ai/store-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      return;
    }
    setAudit(data.insight.content);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI store audit
          </CardTitle>
          <CardDescription>Generated from structural data ADINTEL retrieved — not a live visual review.</CardDescription>
        </div>
        {!audit && (
          <Button size="sm" onClick={run} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Run audit
          </Button>
        )}
      </CardHeader>
      {audit && (
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{audit.summary}</p>
            <ConfidenceBadge level={audit.confidence} className="shrink-0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuditList title="Strengths" items={audit.strengths} tone="success" />
            <AuditList title="Weaknesses" items={audit.weaknesses} tone="warning" />
            <AuditList title="Recommendations" items={audit.recommendations} tone="info" />
            <AuditList title="Priority actions" items={audit.priorityActions} tone="primary" />
          </div>
        </CardContent>
      )}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="AI analyses" />
    </Card>
  );
}

function AuditList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" | "info" | "primary" }) {
  const dotClass = { success: "bg-success", warning: "bg-warning", info: "bg-info", primary: "bg-primary" }[tone];
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
