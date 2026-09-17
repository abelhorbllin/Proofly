"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export function BillingPlans({ currentPlan, stripeConfigured }: { currentPlan: PlanId; stripeConfigured: boolean }) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const router = useRouter();

  async function upgrade(plan: "PRO" | "AGENCY") {
    setLoadingPlan(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoadingPlan(null);

    if (!res.ok) {
      toast.error(data.error ?? "Could not start checkout.");
      return;
    }
    if (data.mock) {
      toast.success(`Upgraded to ${plan} (mock billing — no Stripe keys configured in this environment).`);
      router.refresh();
      return;
    }
    // Standard client-side redirect to Stripe Checkout from a click handler.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = data.url;
  }

  return (
    <div className="space-y-4">
      {!stripeConfigured && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          Stripe is not configured in this environment. Upgrading applies the plan directly (mock billing) so usage
          limits and plan gating remain fully testable. Add STRIPE_SECRET_KEY and price IDs to enable real payments.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = currentPlan === id;
          return (
            <Card key={id} className={cn(isCurrent && "border-primary")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{plan.name}</p>
                  {isCurrent && <Badge>Current plan</Badge>}
                </div>
                <p className="text-2xl font-semibold tracking-tight">
                  {plan.priceMonthly === 0 ? "€0" : `€${plan.priceMonthly}`}
                  {plan.priceMonthly > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-1.5">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && id !== "FREE" && (
                  <Button size="sm" className="w-full" onClick={() => upgrade(id as "PRO" | "AGENCY")} disabled={loadingPlan !== null}>
                    {loadingPlan === id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Choose {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
