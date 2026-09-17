import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/adintel/metric-card";
import { RevenueRangeCard } from "@/components/adintel/revenue-range-card";
import { TrackingSettings } from "@/components/adintel/tracking-settings";
import { Megaphone, Package, Globe2, Swords, ExternalLink } from "lucide-react";
import { formatCompactNumber, formatDate } from "@/lib/utils";

export default async function CompetitorDetailPage({ params }: PageProps<"/competitors/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const competitor = await db.competitor.findFirst({
    where: { id, organizationId },
    include: {
      store: {
        include: {
          _count: { select: { products: true, ads: true } },
          revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
          trafficEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
      tracking: true,
      timelineEvents: { orderBy: { occurredAt: "desc" }, take: 8 },
    },
  });
  if (!competitor) notFound();

  const store = competitor.store;
  const activeAds = store ? await db.ad.count({ where: { storeId: store.id, status: "ACTIVE" } }) : 0;
  const platforms = store ? await db.ad.findMany({ where: { storeId: store.id }, select: { platform: true }, distinct: ["platform"] }) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{competitor.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" /> {competitor.domain}
          </p>
          {competitor.category && <Badge variant="secondary" className="mt-2">{competitor.category}</Badge>}
        </div>
        <div className="flex shrink-0 gap-2">
          {store && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/stores/${store.id}`}>
                <ExternalLink className="h-4 w-4" /> Full store analysis
              </Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href={`/compare?b=${store?.id ?? ""}`}>
              <Swords className="h-4 w-4" /> Compare
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active ads" value={activeAds} icon={Megaphone} />
        <MetricCard label="Products tracked" value={store?._count.products ?? 0} icon={Package} />
        <MetricCard label="Platforms" value={platforms.map((p) => p.platform).join(", ") || "None"} />
        <MetricCard
          label="Estimated traffic"
          value={
            store?.trafficEstimates[0]
              ? `${formatCompactNumber(store.trafficEstimates[0].monthlyVisitsLow)}–${formatCompactNumber(store.trafficEstimates[0].monthlyVisitsHigh)}`
              : "Insufficient data"
          }
        />
      </div>

      {store?.revenueEstimates[0] && (
        <RevenueRangeCard
          label="Estimated monthly revenue"
          low={store.revenueEstimates[0].monthlyLow}
          high={store.revenueEstimates[0].monthlyHigh}
          currency={store.currency}
          confidence={store.revenueEstimates[0].confidence}
          methodology={store.revenueEstimates[0].methodology}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Changes detected on this competitor since tracking began.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {competitor.timelineEvents.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              competitor.timelineEvents.map((e) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracking settings</CardTitle>
            <CardDescription>Choose what triggers an alert for this competitor.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackingSettings
              competitorId={competitor.id}
              initial={{
                trackNewAds: competitor.tracking?.trackNewAds ?? true,
                trackNewProducts: competitor.tracking?.trackNewProducts ?? true,
                trackPriceChanges: competitor.tracking?.trackPriceChanges ?? true,
                trackLandingPages: competitor.tracking?.trackLandingPages ?? true,
                trackStoreChanges: competitor.tracking?.trackStoreChanges ?? true,
                trackCreatives: competitor.tracking?.trackCreatives ?? true,
                trackAdStatus: competitor.tracking?.trackAdStatus ?? true,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
