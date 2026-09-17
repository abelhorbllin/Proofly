import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { computeStoreSignals, daysBetween } from "@/lib/analysis/compute-signals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/adintel/metric-card";
import { SignalCard } from "@/components/adintel/signal-card";
import { RevenueRangeCard } from "@/components/adintel/revenue-range-card";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { InfoTooltip } from "@/components/adintel/info-tooltip";
import { TrafficChart } from "@/components/adintel/traffic-chart";
import { TrackCompetitorButton } from "@/components/adintel/track-competitor-button";
import { SaveButton } from "@/components/adintel/save-button";
import { AIStoreAudit } from "@/components/adintel/ai-store-audit";
import { ProductCard } from "@/components/adintel/product-card";
import { AdCard } from "@/components/adintel/ad-card";
import { EmptyState } from "@/components/adintel/empty-state";
import { Package, Megaphone, Globe2, History } from "lucide-react";
import { formatCompactNumber, formatDate } from "@/lib/utils";

export default async function StoreDetailPage({ params }: PageProps<"/stores/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const store = await db.store.findFirst({
    where: { id, organizationId },
    include: {
      competitor: true,
      products: { orderBy: { lastObservedAt: "desc" }, take: 8, include: { _count: { select: { ads: true } } } },
      ads: {
        orderBy: { lastSeenAt: "desc" },
        take: 6,
        include: { creatives: { take: 1, orderBy: { firstSeenAt: "desc" } }, product: true },
      },
      trafficEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
      revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
      timelineEvents: { orderBy: { occurredAt: "desc" }, take: 6 },
      _count: { select: { products: true, ads: true } },
    },
  });

  if (!store) notFound();

  const [activeAdCount, distinctAnglesResult, savedItem] = await Promise.all([
    db.ad.count({ where: { storeId: store.id, status: "ACTIVE" } }),
    db.ad.findMany({ where: { storeId: store.id }, select: { angle: true }, distinct: ["angle"] }),
    db.savedItem.findFirst({ where: { userId: session.user.id, storeId: store.id } }),
  ]);

  const traffic = store.trafficEstimates[0];
  const revenue = store.revenueEstimates[0];
  const distinctAngles = distinctAnglesResult.filter((a) => a.angle).length;

  const signals = computeStoreSignals({
    activeAdCount,
    totalAdCount: store._count.ads,
    productCount: store._count.products,
    distinctAngles,
    daysSinceFirstObserved: store.firstObservedAt ? daysBetween(store.firstObservedAt, new Date()) : 0,
    trafficConfidence: traffic?.confidence ?? "LOW",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{store.name}</h1>
            <Badge variant={store.status === "COMPLETED" ? "success" : "warning"}>{store.status}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" /> {store.domain}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {store.platform && <Badge variant="secondary">{store.platform}</Badge>}
            {store.country && <Badge variant="secondary">{store.country}</Badge>}
            {store.category && <Badge variant="secondary">{store.category}</Badge>}
            <Badge variant="outline">Last analyzed {formatDate(store.updatedAt)}</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <SaveButton entityType="STORE" entityId={store.id} initiallySaved={!!savedItem} />
          <TrackCompetitorButton storeId={store.id} initiallyTracked={!!store.competitor?.tracked} />
        </div>
      </div>

      {/* Validation signals */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Validation signals</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <SignalCard key={s.label} label={s.label} value={s.value} explanation={s.explanation} />
          ))}
        </div>
      </section>

      {/* Overview metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Products detected" value={store._count.products} icon={Package} />
        <MetricCard label="Active ads" value={activeAdCount} icon={Megaphone} hint={`${store._count.ads} total observed`} />
        <MetricCard
          label="Estimated traffic"
          value={traffic ? `${formatCompactNumber(traffic.monthlyVisitsLow)}–${formatCompactNumber(traffic.monthlyVisitsHigh)}` : "Insufficient data"}
          icon={Globe2}
          hint="monthly visits"
        />
        <MetricCard
          label="First observed"
          value={store.firstObservedAt ? formatDate(store.firstObservedAt) : "Unknown"}
          icon={History}
        />
      </section>

      {/* Revenue + traffic */}
      <section className="grid gap-4 lg:grid-cols-3">
        {revenue ? (
          <RevenueRangeCard
            label="Estimated monthly revenue"
            low={revenue.monthlyLow}
            high={revenue.monthlyHigh}
            currency={store.currency}
            confidence={revenue.confidence}
            methodology={revenue.methodology}
          />
        ) : (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">Unable to estimate reliably — insufficient public data.</CardContent>
          </Card>
        )}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-1.5">
                Traffic trend
                {traffic && <InfoTooltip methodology={traffic.methodology} />}
              </CardTitle>
              <CardDescription>Estimated monthly visits over the last 12 months.</CardDescription>
            </div>
            {traffic && <ConfidenceBadge level={traffic.confidence} />}
          </CardHeader>
          <CardContent>
            {traffic ? (
              <TrafficChart trend={traffic.trend as { date: string; visits: number }[]} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Insufficient public data to estimate traffic.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {revenue && (
        <section className="grid gap-4 sm:grid-cols-3">
          <RevenueRangeCard label="Estimated daily revenue" low={revenue.dailyLow} high={revenue.dailyHigh} currency={store.currency} confidence={revenue.confidence} methodology={revenue.methodology} />
          <RevenueRangeCard label="Estimated annual revenue" low={revenue.annualLow} high={revenue.annualHigh} currency={store.currency} confidence={revenue.confidence} methodology={revenue.methodology} />
          {revenue.adSpendMonthlyLow !== null && revenue.adSpendMonthlyHigh !== null && (
            <RevenueRangeCard label="Estimated monthly ad spend" low={revenue.adSpendMonthlyLow} high={revenue.adSpendMonthlyHigh} currency={store.currency} confidence="LOW" methodology="Modeled as a share of estimated revenue, calibrated against observed ad creative volume." />
          )}
        </section>
      )}

      {/* Products */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Products</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/products?storeId=${store.id}`}>View all</Link>
          </Button>
        </div>
        {store.products.length === 0 ? (
          <EmptyState icon={Package} title="No products detected" description="We couldn't retrieve product data for this store." className="py-10" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {store.products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                compareAtPrice={p.compareAtPrice}
                currency={p.currency}
                image={Array.isArray(p.images) ? (p.images as string[])[0] : null}
                adCount={p._count.ads}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ads */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent ads</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/ads?storeId=${store.id}`}>Open ad library</Link>
          </Button>
        </div>
        {store.ads.length === 0 ? (
          <EmptyState icon={Megaphone} title="No ad data available" description="We couldn't retrieve supported public advertising data for this store." className="py-10" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {store.ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                platform={ad.platform}
                format={ad.creatives[0]?.format ?? "OTHER"}
                status={ad.status}
                headline={ad.creatives[0]?.headline ?? ad.offer ?? "Ad"}
                thumbnailUrl={ad.creatives[0]?.thumbnailUrl ?? null}
                lastSeenAt={ad.lastSeenAt}
                productName={ad.product?.name}
              />
            ))}
          </div>
        )}
      </section>

      {/* AI Store Audit */}
      <AIStoreAudit storeId={store.id} />

      {/* Timeline */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/timeline?storeId=${store.id}`}>Full timeline</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {store.timelineEvents.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              store.timelineEvents.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.occurredAt)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
