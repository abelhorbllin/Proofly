"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Swords } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";

interface StoreOption {
  id: string;
  name: string;
  domain: string;
}

interface StoreFacts {
  id: string;
  name: string;
  domain: string;
  productCount: number;
  activeAdCount: number;
  avgPrice: number | null;
  currency: string;
  trafficLow: number | null;
  trafficHigh: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  videoCount: number;
}

export function CompareClient({ stores, presetB }: { stores: StoreOption[]; presetB?: string }) {
  const [storeAId, setStoreAId] = useState(stores[0]?.id ?? "");
  const [storeBId, setStoreBId] = useState(presetB ?? stores[1]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ a: StoreFacts; b: StoreFacts; facts: string[]; aiSummary: { summary: string; confidence: "LOW" | "MEDIUM" | "HIGH" } } | null>(null);

  async function compare() {
    if (!storeAId || !storeBId || storeAId === storeBId) return;
    setLoading(true);
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeAId, storeBId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setResult(data);
  }

  if (stores.length < 2) {
    return <p className="text-sm text-muted-foreground">Analyze at least two stores to use the comparison tool.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-5 sm:flex-row">
          <StoreSelect stores={stores} value={storeAId} onChange={setStoreAId} placeholder="Store A" />
          <Swords className="h-5 w-5 shrink-0 text-muted-foreground" />
          <StoreSelect stores={stores} value={storeBId} onChange={setStoreBId} placeholder="Store B" />
          <Button onClick={compare} disabled={loading || !storeAId || !storeBId || storeAId === storeBId} className="w-full sm:w-auto">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Compare
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Comparison</CardTitle>
              <ConfidenceBadge level={result.aiSummary.confidence} />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.aiSummary.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Metric</th>
                    <th className="px-5 py-3 font-medium">{result.a.name}</th>
                    <th className="px-5 py-3 font-medium">{result.b.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <Row label="Products tracked" a={result.a.productCount} b={result.b.productCount} />
                  <Row label="Active ads" a={result.a.activeAdCount} b={result.b.activeAdCount} />
                  <Row
                    label="Average price"
                    a={result.a.avgPrice !== null ? formatCurrency(result.a.avgPrice, result.a.currency) : "Insufficient data"}
                    b={result.b.avgPrice !== null ? formatCurrency(result.b.avgPrice, result.b.currency) : "Insufficient data"}
                  />
                  <Row
                    label="Estimated traffic"
                    a={result.a.trafficLow !== null ? `${formatCompactNumber(result.a.trafficLow)}–${formatCompactNumber(result.a.trafficHigh!)}` : "Insufficient data"}
                    b={result.b.trafficLow !== null ? `${formatCompactNumber(result.b.trafficLow)}–${formatCompactNumber(result.b.trafficHigh!)}` : "Insufficient data"}
                  />
                  <Row
                    label="Estimated monthly revenue"
                    a={result.a.revenueLow !== null ? `${formatCurrency(result.a.revenueLow, result.a.currency)}–${formatCurrency(result.a.revenueHigh!, result.a.currency)}` : "Insufficient data"}
                    b={result.b.revenueLow !== null ? `${formatCurrency(result.b.revenueLow, result.b.currency)}–${formatCurrency(result.b.revenueHigh!, result.b.currency)}` : "Insufficient data"}
                  />
                  <Row label="Video creatives observed" a={result.a.videoCount} b={result.b.videoCount} />
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observed differences</p>
            <ul className="space-y-1.5">
              {result.facts.map((f) => (
                <li key={f} className="text-sm text-muted-foreground">{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreSelect({
  stores,
  value,
  onChange,
  placeholder,
}: {
  stores: StoreOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name} ({s.domain})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Row({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <tr>
      <td className="px-5 py-3 text-muted-foreground">{label}</td>
      <td className="px-5 py-3 font-medium">{a}</td>
      <td className="px-5 py-3 font-medium">{b}</td>
    </tr>
  );
}
