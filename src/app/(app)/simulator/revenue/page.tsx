"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { SCENARIO_MULTIPLIERS, simulateRevenue, type Scenario } from "@/lib/calculations/unit-economics";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";

export default function RevenueSimulatorPage() {
  const [scenario, setScenario] = useState<Scenario>("BASE");
  const [traffic, setTraffic] = useState(100000);
  const [conversion, setConversion] = useState(1.5);
  const [aov, setAov] = useState(60);
  const [grossMarginPct, setGrossMarginPct] = useState(55);
  const [adSpend, setAdSpend] = useState(12000);

  const multiplier = SCENARIO_MULTIPLIERS[scenario];

  const result = useMemo(
    () =>
      simulateRevenue({
        monthlyTraffic: Math.round(traffic * multiplier.traffic),
        conversionRatePct: Number((conversion * multiplier.conversion).toFixed(2)),
        aov,
        grossMarginPct,
        monthlyAdSpend: Math.round(adSpend * multiplier.adSpend),
      }),
    [traffic, conversion, aov, grossMarginPct, adSpend, multiplier]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <TrendingUp className="h-6 w-6 text-primary" /> Revenue simulator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Model how traffic, conversion and AOV assumptions translate into revenue. This is a simulation based on
          your inputs, not a forecast of actual performance.
        </p>
      </div>

      <Tabs value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
        <TabsList>
          <TabsTrigger value="CONSERVATIVE">Conservative</TabsTrigger>
          <TabsTrigger value="BASE">Base</TabsTrigger>
          <TabsTrigger value="OPTIMISTIC">Optimistic</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assumptions</CardTitle>
          <CardDescription>Base values — the selected scenario applies a multiplier automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SliderField label="Monthly traffic" value={traffic} onChange={setTraffic} min={1000} max={1000000} step={1000} format={(v) => formatCompactNumber(v)} />
          <SliderField label="Conversion rate" value={conversion} onChange={setConversion} min={0.2} max={6} step={0.1} format={(v) => `${v.toFixed(1)}%`} />
          <SliderField label="Average order value" value={aov} onChange={setAov} min={10} max={300} step={1} format={(v) => formatCurrency(v)} />
          <SliderField label="Gross margin" value={grossMarginPct} onChange={setGrossMarginPct} min={10} max={90} step={1} format={(v) => `${v}%`} />
          <SliderField label="Monthly ad spend" value={adSpend} onChange={setAdSpend} min={0} max={100000} step={500} format={(v) => formatCurrency(v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Simulated outcome</CardTitle>
          <Badge variant="outline">Simulation — {scenario.toLowerCase()}</Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Estimated orders" value={result.estimatedOrders.toLocaleString()} />
          <Stat label="Estimated revenue" value={formatCurrency(result.estimatedRevenue)} />
          <Stat label="Estimated gross profit" value={formatCurrency(result.estimatedGrossProfit)} />
          <Stat
            label="Estimated contribution"
            value={formatCurrency(result.estimatedContributionProfit)}
            tone={result.estimatedContributionProfit >= 0 ? "success" : "danger"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-sm font-medium">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}
