import { requireSession } from "@/lib/auth/session";
import { getUsageSummary } from "@/lib/billing/usage";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsageBar } from "@/components/adintel/usage-bar";
import { BillingPlans } from "@/components/adintel/billing-plans";
import { ManageBillingButton } from "@/components/adintel/manage-billing-button";

const METRIC_LABELS: Record<string, string> = {
  storeAnalyses: "Store analyses",
  productValidations: "Product validations",
  aiAnalyses: "AI analyses",
  competitorsTracked: "Competitors tracked",
  reportsGenerated: "Reports generated",
};

export default async function BillingPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const [usage, subscription] = await Promise.all([
    getUsageSummary(organizationId),
    db.subscription.findUnique({ where: { organizationId } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your plan and view usage for this billing period.</p>
        </div>
        {subscription?.stripeCustomerId && <ManageBillingButton />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage this month</CardTitle>
          <CardDescription>Resets on the 1st of each month.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {usage.metrics.map((m) => (
            <UsageBar key={m.metric} used={m.used} limit={m.limit} label={METRIC_LABELS[m.metric]} />
          ))}
        </CardContent>
      </Card>

      <BillingPlans currentPlan={usage.plan} stripeConfigured={isStripeConfigured()} />
    </div>
  );
}
