"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yearly && "text-foreground font-medium", yearly && "text-muted-foreground")}>Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={cn("text-sm", yearly && "text-foreground font-medium", !yearly && "text-muted-foreground")}>
          Yearly <span className="text-success">(save ~20%)</span>
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const popular = id === "PRO";
          return (
            <Card key={id} className={cn("relative flex flex-col", popular && "border-primary shadow-lg shadow-primary/10")}>
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <CardHeader>
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {price === 0 ? "€0" : `€${price}`}
                  {price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={popular ? "default" : "secondary"} asChild>
                  <Link href="/signup">{id === "FREE" ? "Start for free" : `Choose ${plan.name}`}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
