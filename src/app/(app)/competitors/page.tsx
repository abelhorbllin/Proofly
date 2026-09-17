import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/adintel/empty-state";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { Users, Search, Swords, Radar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function CompetitorsPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const competitors = await db.competitor.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      store: {
        include: {
          revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { ads: { where: { status: "ACTIVE" } }, products: true } },
        },
      },
      tracking: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Competitors</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stores you&apos;re tracking for ads, products and pricing changes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link href="/compare">
              <Swords className="h-4 w-4" /> Compare
            </Link>
          </Button>
          <Button asChild>
            <Link href="/analyze/store">
              <Search className="h-4 w-4" /> Analyze Store
            </Link>
          </Button>
        </div>
      </div>

      {competitors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No competitors tracked yet."
          description="Analyze a store and click 'Track competitor' to start monitoring their ads, products and pricing."
          action={
            <Button asChild>
              <Link href="/analyze/store">Add competitor</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competitors.map((c) => {
            const revenue = c.store?.revenueEstimates[0];
            return (
              <Link key={c.id} href={`/competitors/${c.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.domain}</p>
                      </div>
                      {c.tracking?.enabled && (
                        <Badge variant="success" className="gap-1">
                          <Radar className="h-3 w-3" /> Tracking
                        </Badge>
                      )}
                    </div>
                    {c.category && <Badge variant="secondary" className="mb-3">{c.category}</Badge>}
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{c.store?._count.ads ?? 0} active ads</span>
                      <span>{c.store?._count.products ?? 0} products</span>
                    </div>
                    {revenue ? (
                      <div className="rounded-md border border-border bg-surface-2 p-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Est. monthly revenue</span>
                          <ConfidenceBadge level={revenue.confidence} className="px-1.5 py-0 text-[9px]" />
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(revenue.monthlyLow, c.store?.currency)}–{formatCurrency(revenue.monthlyHigh, c.store?.currency)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Insufficient public data</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
