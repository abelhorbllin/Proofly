import { db } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export type UsageMetric = "storeAnalyses" | "productValidations" | "aiAnalyses" | "competitorsTracked" | "reportsGenerated";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

async function getOrCreateUsage(organizationId: string) {
  const period = currentPeriod();
  return db.usage.upsert({
    where: { organizationId_period: { organizationId, period } },
    update: {},
    create: { organizationId, period },
  });
}

async function getPlan(organizationId: string): Promise<PlanId> {
  const sub = await db.subscription.findUnique({ where: { organizationId } });
  return sub?.plan ?? "FREE";
}

/** Throws if the organization has hit its plan limit for this metric. Call before performing the action. */
export async function assertUsageAvailable(organizationId: string, metric: UsageMetric) {
  const [usage, plan] = await Promise.all([getOrCreateUsage(organizationId), getPlan(organizationId)]);
  const limit = PLANS[plan].limits[metric];
  const used = usage[metric];
  if (used >= limit) {
    throw new UsageLimitError(metric, plan, limit);
  }
}

export async function incrementUsage(organizationId: string, metric: UsageMetric, amount = 1) {
  const period = currentPeriod();
  await db.usage.upsert({
    where: { organizationId_period: { organizationId, period } },
    update: { [metric]: { increment: amount } },
    create: { organizationId, period, [metric]: amount },
  });
}

export async function getUsageSummary(organizationId: string) {
  const [usage, plan] = await Promise.all([getOrCreateUsage(organizationId), getPlan(organizationId)]);
  const limits = PLANS[plan].limits;

  const metrics: UsageMetric[] = ["storeAnalyses", "productValidations", "aiAnalyses", "competitorsTracked", "reportsGenerated"];
  return {
    plan,
    period: usage.period,
    metrics: metrics.map((metric) => ({
      metric,
      used: usage[metric],
      limit: limits[metric],
      percentage: limits[metric] === Infinity ? 0 : Math.min(100, Math.round((usage[metric] / limits[metric]) * 100)),
    })),
  };
}

export class UsageLimitError extends Error {
  metric: UsageMetric;
  plan: PlanId;
  limit: number;

  constructor(metric: UsageMetric, plan: PlanId, limit: number) {
    super(`Usage limit reached for ${metric} on the ${plan} plan (limit: ${limit}). Upgrade to continue.`);
    this.name = "UsageLimitError";
    this.metric = metric;
    this.plan = plan;
    this.limit = limit;
  }
}
