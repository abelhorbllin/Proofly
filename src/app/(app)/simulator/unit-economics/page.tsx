"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import { computeUnitEconomics } from "@/lib/calculations/unit-economics";
import { formatCurrency } from "@/lib/utils";

export default function UnitEconomicsPage() {
  const [sellingPrice, setSellingPrice] = useState(39.99);
  const [productCost, setProductCost] = useState(9);
  const [shippingCost, setShippingCost] = useState(3.5);
  const [paymentFeePct, setPaymentFeePct] = useState(2.9);
  const [refundRatePct, setRefundRatePct] = useState(5);
  const [conversionRatePct, setConversionRatePct] = useState(1.8);
  const [avgCpc, setAvgCpc] = useState(0.6);
  const [ctrPct, setCtrPct] = useState(1.2);
  const [adSpendDaily, setAdSpendDaily] = useState(80);

  const result = useMemo(
    () => computeUnitEconomics({ sellingPrice, productCost, shippingCost, paymentFeePct, refundRatePct }),
    [sellingPrice, productCost, shippingCost, paymentFeePct, refundRatePct]
  );

  const clicksPerDay = avgCpc > 0 ? adSpendDaily / avgCpc : 0;
  const visitorsPerDay = ctrPct > 0 ? clicksPerDay / (ctrPct / 100) : clicksPerDay;
  const ordersPerDay = visitorsPerDay * (conversionRatePct / 100);
  const cac = ordersPerDay > 0 ? adSpendDaily / ordersPerDay : 0;
  const estimatedDailyProfit = ordersPerDay * result.grossProfitPerOrder - adSpendDaily;
  const estimatedMonthlyProfit = estimatedDailyProfit * 30;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Calculator className="h-6 w-6 text-primary" /> Unit economics calculator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A transparent, interactive model — every number below is computed from the inputs you provide. This is a
          simulation, not a prediction.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inputs</CardTitle>
            <CardDescription>Adjust any value to see the model update instantly.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <NumberField label="Selling price" value={sellingPrice} onChange={setSellingPrice} suffix="€" />
            <NumberField label="Product cost" value={productCost} onChange={setProductCost} suffix="€" />
            <NumberField label="Shipping cost" value={shippingCost} onChange={setShippingCost} suffix="€" />
            <NumberField label="Payment fee" value={paymentFeePct} onChange={setPaymentFeePct} suffix="%" />
            <NumberField label="Refund rate" value={refundRatePct} onChange={setRefundRatePct} suffix="%" />
            <NumberField label="Conversion rate" value={conversionRatePct} onChange={setConversionRatePct} suffix="%" step={0.1} />
            <NumberField label="Avg. CPC" value={avgCpc} onChange={setAvgCpc} suffix="€" step={0.05} />
            <NumberField label="CTR" value={ctrPct} onChange={setCtrPct} suffix="%" step={0.1} />
            <NumberField label="Daily ad spend" value={adSpendDaily} onChange={setAdSpendDaily} suffix="€" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-order economics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Stat label="Gross profit / order" value={formatCurrency(result.grossProfitPerOrder)} />
              <Stat label="Gross margin" value={`${result.grossMarginPct}%`} />
              <Stat label="Payment fee" value={formatCurrency(result.paymentFeeAmount)} />
              <Stat label="Refund loss (modeled)" value={formatCurrency(result.refundLossAmount)} />
              <Stat label="Break-even CAC" value={formatCurrency(result.breakEvenCAC)} />
              <Stat label="Break-even ROAS" value={Number.isFinite(result.breakEvenROAS) ? `${result.breakEvenROAS}x` : "N/A"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Campaign simulation</CardTitle>
              <Badge variant="outline">Simulation</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Stat label="Est. daily orders" value={ordersPerDay.toFixed(1)} />
              <Stat label="Est. CAC" value={formatCurrency(cac)} />
              <Stat
                label="Est. daily profit"
                value={formatCurrency(estimatedDailyProfit)}
                tone={estimatedDailyProfit >= 0 ? "success" : "danger"}
              />
              <Stat
                label="Est. monthly profit"
                value={formatCurrency(estimatedMonthlyProfit)}
                tone={estimatedMonthlyProfit >= 0 ? "success" : "danger"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={suffix ? "pr-8" : undefined}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
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
