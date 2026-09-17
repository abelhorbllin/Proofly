import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/adintel/empty-state";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { Store as StoreIcon, Search, Package, Megaphone } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StoresPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const stores = await db.store.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { products: true, ads: true } },
      revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every store you&apos;ve analyzed, with its latest signals.</p>
        </div>
        <Button asChild>
          <Link href="/analyze/store">
            <Search className="h-4 w-4" /> Analyze Store
          </Link>
        </Button>
      </div>

      {stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="No stores analyzed yet"
          description="Enter a competitor's URL to see products, ads, traffic and revenue estimates."
          action={
            <Button asChild>
              <Link href="/analyze/store">Analyze a store</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const revenue = store.revenueEstimates[0];
            return (
              <Link key={store.id} href={`/stores/${store.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{store.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{store.domain}</p>
                      </div>
                      <Badge variant={store.status === "COMPLETED" ? "success" : "warning"}>{store.status}</Badge>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {store.category && <Badge variant="secondary">{store.category}</Badge>}
                      {store.platform && <Badge variant="secondary">{store.platform}</Badge>}
                      {store.country && <Badge variant="secondary">{store.country}</Badge>}
                    </div>
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" /> {store._count.products} products
                      </span>
                      <span className="flex items-center gap-1">
                        <Megaphone className="h-3 w-3" /> {store._count.ads} ads
                      </span>
                    </div>
                    {revenue ? (
                      <div className="rounded-md border border-border bg-surface-2 p-2.5">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Est. monthly revenue</span>
                          <ConfidenceBadge level={revenue.confidence} className="px-1.5 py-0 text-[9px]" />
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(revenue.monthlyLow, store.currency)}–{formatCurrency(revenue.monthlyHigh, store.currency)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Insufficient public data</p>
                    )}
                    <p className="mt-3 text-[11px] text-muted-foreground">Last analyzed {formatDate(store.updatedAt)}</p>
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
