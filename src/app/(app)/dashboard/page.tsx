import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getUsageSummary } from "@/lib/billing/usage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageBar } from "@/components/adintel/usage-bar";
import { MetricCard } from "@/components/adintel/metric-card";
import { EmptyState } from "@/components/adintel/empty-state";
import { StoreAnalyzerInput } from "@/components/adintel/store-analyzer-input";
import {
  Store,
  Package,
  Users,
  Bell,
  ArrowRight,
  Sparkles,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const [storeCount, productCount, competitorCount, unreadAlerts, recentStores, trackedCompetitors, latestAlerts, latestInsight, usage] =
    await Promise.all([
      db.store.count({ where: { organizationId } }),
      db.product.count({ where: { store: { organizationId } } }),
      db.competitor.count({ where: { organizationId, tracked: true } }),
      db.alert.count({ where: { organizationId, read: false } }),
      db.store.findMany({ where: { organizationId }, orderBy: { updatedAt: "desc" }, take: 5 }),
      db.competitor.findMany({ where: { organizationId, tracked: true }, orderBy: { updatedAt: "desc" }, take: 5, include: { store: true } }),
      db.alert.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 5 }),
      db.aIInsight.findFirst({ where: { organizationId, type: "STRATEGY" }, orderBy: { createdAt: "desc" } }),
      getUsageSummary(organizationId),
    ]);

  const greeting = getGreeting();
  const insightContent = latestInsight?.content as { summary?: string } | null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {session.user.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your tracked stores and competitors.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/validate">
              <ShieldCheck className="h-4 w-4" /> Validate Product
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/analyze/store">
              <Search className="h-4 w-4" /> Analyze Store
            </Link>
          </Button>
        </div>
      </div>

      <StoreAnalyzerInput />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Stores analyzed" value={storeCount} icon={Store} />
        <MetricCard label="Products tracked" value={productCount} icon={Package} />
        <MetricCard label="Competitors tracked" value={competitorCount} icon={Users} />
        <MetricCard label="Active alerts" value={unreadAlerts} icon={Bell} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent analyses</CardTitle>
                <CardDescription>Your most recently analyzed stores.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/stores">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentStores.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No stores analyzed yet"
                  description="Analyze your first competitor store to see products, ads, traffic and revenue estimates."
                  action={
                    <Button size="sm" asChild>
                      <Link href="/analyze/store">Analyze a store</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y divide-border">
                  {recentStores.map((store) => (
                    <Link key={store.id} href={`/stores/${store.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{store.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{store.domain}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={store.status === "COMPLETED" ? "success" : "warning"}>{store.status}</Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(store.updatedAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Latest alerts</CardTitle>
                <CardDescription>Changes detected across tracked competitors.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/alerts">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {latestAlerts.length === 0 ? (
                <EmptyState icon={Bell} title="No alerts yet" description="Track a competitor to start receiving change alerts." />
              ) : (
                <div className="divide-y divide-border">
                  {latestAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{alert.body}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(alert.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> AI recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightContent?.summary ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{insightContent.summary}</p>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="No insight yet"
                  description="Track a few competitors to unlock AI strategy insights."
                  className="py-8"
                />
              )}
              <Button variant="ghost" size="sm" className="mt-3 px-0" asChild>
                <Link href="/ai">
                  Open AI Strategy <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracked competitors</CardTitle>
            </CardHeader>
            <CardContent>
              {trackedCompetitors.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="No competitors tracked"
                  description="Add a competitor to monitor their ads, products and pricing."
                  className="py-8"
                  action={
                    <Button size="sm" variant="secondary" asChild>
                      <Link href="/competitors">Add competitor</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {trackedCompetitors.map((c) => (
                    <Link key={c.id} href={`/competitors/${c.id}`} className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{c.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{c.domain}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage this month</CardTitle>
              <CardDescription>Plan: {usage.plan}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {usage.metrics.map((m) => (
                <UsageBar key={m.metric} used={m.used} limit={m.limit} label={metricLabel(m.metric)} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function metricLabel(metric: string) {
  const map: Record<string, string> = {
    storeAnalyses: "Store analyses",
    productValidations: "Product validations",
    aiAnalyses: "AI analyses",
    competitorsTracked: "Competitors tracked",
    reportsGenerated: "Reports generated",
  };
  return map[metric] ?? metric;
}
