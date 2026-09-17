"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { ValidationReportView } from "@/components/adintel/validation-report-view";
import { Loader2, ShieldCheck } from "lucide-react";
import type { ValidationReport } from "@/lib/validation/types";

export default function ValidatePage() {
  return (
    <Suspense>
      <ValidateForm />
    </Suspense>
  );
}

function ValidateForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    productId: searchParams.get("productId") ?? "",
    productName: "",
    productUrl: "",
    competitorStoreUrl: "",
    sellingPrice: "",
    productCost: "",
    shippingCost: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName.trim() || !form.sellingPrice) return;

    setLoading(true);
    setError(null);
    setReport(null);

    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: form.productId || undefined,
        productName: form.productName,
        productUrl: form.productUrl || undefined,
        competitorStoreUrl: form.competitorStoreUrl || undefined,
        sellingPrice: Number(form.sellingPrice),
        productCost: form.productCost ? Number(form.productCost) : undefined,
        shippingCost: form.shippingCost ? Number(form.shippingCost) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      else setError(data.error ?? "Something went wrong.");
      return;
    }

    setReport(data.report);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" /> Validate a product
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Combine market signals, competitor activity, advertising data and unit economics into one evidence-based
          validation report.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
          <CardDescription>The more detail you provide, the more precise the validation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" required>
              <Input required value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="Portable Massage Gun" />
            </Field>
            <Field label="Product URL (optional)">
              <Input value={form.productUrl} onChange={(e) => update("productUrl", e.target.value)} placeholder="competitorstore.com/products/example" />
            </Field>
            <Field label="Competitor store URL (optional)">
              <Input value={form.competitorStoreUrl} onChange={(e) => update("competitorStoreUrl", e.target.value)} placeholder="competitorstore.com" />
            </Field>
            <Field label="Selling price" required>
              <Input required type="number" min={0} step="0.01" value={form.sellingPrice} onChange={(e) => update("sellingPrice", e.target.value)} placeholder="39.99" />
            </Field>
            <Field label="Estimated product cost (optional)">
              <Input type="number" min={0} step="0.01" value={form.productCost} onChange={(e) => update("productCost", e.target.value)} placeholder="8.50" />
            </Field>
            <Field label="Shipping cost (optional)">
              <Input type="number" min={0} step="0.01" value={form.shippingCost} onChange={(e) => update("shippingCost", e.target.value)} placeholder="3.00" />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Validate opportunity
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {report && <ValidationReportView report={report} />}

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="product validations" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
