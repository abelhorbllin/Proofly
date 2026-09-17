import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/adintel/empty-state";
import { Bookmark } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_HREF: Record<string, string> = { STORE: "/stores", PRODUCT: "/products", AD: "/ads", COMPETITOR: "/competitors" };

export default async function SavedPage() {
  const session = await requireSession();

  const items = await db.savedItem.findMany({
    where: { userId: session.user.id },
    include: { store: true, product: { include: { store: true } }, ad: { include: { store: true } }, competitor: true },
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    if (!grouped.has(item.folder)) grouped.set(item.folder, []);
    grouped.get(item.folder)!.push(item);
  }

  function entityName(item: (typeof items)[number]) {
    return item.store?.name ?? item.product?.name ?? item.ad?.offer ?? item.competitor?.name ?? "Unknown";
  }
  function entityId(item: (typeof items)[number]) {
    return item.storeId ?? item.productId ?? item.adId ?? item.competitorId ?? "";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stores, products, ads and competitors you&apos;ve bookmarked.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bookmark} title="Nothing saved yet" description="Use the Save button on any store, product, ad or competitor page to bookmark it here." />
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([folder, folderItems]) => (
            <div key={folder}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{folder}</p>
              <div className="space-y-2">
                {folderItems.map((item) => (
                  <Link key={item.id} href={`${TYPE_HREF[item.entityType]}/${entityId(item)}`}>
                    <Card className="transition-colors hover:border-primary/40">
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{entityName(item)}</p>
                          <p className="text-xs text-muted-foreground">Saved {formatDate(item.createdAt)}</p>
                        </div>
                        <Badge variant="secondary">{item.entityType}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
