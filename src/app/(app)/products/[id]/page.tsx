import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/adintel/save-button";
import { AdCard } from "@/components/adintel/ad-card";
import { EmptyState } from "@/components/adintel/empty-state";
import { ShieldCheck, Store as StoreIcon, Megaphone } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const product = await db.product.findFirst({
    where: { id, store: { organizationId } },
    include: {
      store: true,
      ads: { include: { creatives: { take: 1, orderBy: { firstSeenAt: "desc" } } }, orderBy: { lastSeenAt: "desc" } },
    },
  });
  if (!product) notFound();

  const savedItem = await db.savedItem.findFirst({ where: { userId: session.user.id, productId: product.id } });

  // Competitor discovery: other stores in this workspace carrying a similarly named product.
  const firstWord = product.name.split(" ")[0];
  const similarProducts = await db.product.findMany({
    where: {
      store: { organizationId },
      id: { not: product.id },
      name: { contains: firstWord, mode: "insensitive" },
    },
    include: { store: true },
    take: 6,
  });

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const landingPages = Array.from(new Set(product.ads.map((a) => a.landingPageUrl).filter(Boolean)));
  const platforms = Array.from(new Set(product.ads.map((a) => a.platform)));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/stores/${product.storeId}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <StoreIcon className="h-3 w-3" /> {product.store.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            {product.price !== null && <span className="text-lg font-semibold">{formatCurrency(product.price, product.currency)}</span>}
            {product.compareAtPrice && <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.compareAtPrice, product.currency)}</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <SaveButton entityType="PRODUCT" entityId={product.id} initiallySaved={!!savedItem} />
          <Button size="sm" asChild>
            <Link href={`/validate?productId=${product.id}`}>
              <ShieldCheck className="h-4 w-4" /> Validate this product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="relative aspect-square bg-surface-2">
            {images[0] && <Image src={images[0]} alt={product.name} fill className="object-cover" unoptimized />}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Detail label="Ads observed" value={String(product.ads.length)} />
              <Detail label="Platforms" value={platforms.join(", ") || "None"} />
              <Detail label="Landing pages" value={String(landingPages.length)} />
              <Detail label="First observed" value={product.firstObservedAt ? formatDate(product.firstObservedAt) : "Unknown"} />
              <Detail label="Last observed" value={product.lastObservedAt ? formatDate(product.lastObservedAt) : "Unknown"} />
              <Detail label="Currency" value={product.currency} />
            </CardContent>
          </Card>
          {product.description && (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">{product.description}</CardContent>
            </Card>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Ads for this product</h2>
        {product.ads.length === 0 ? (
          <EmptyState icon={Megaphone} title="No ads detected" description="No advertising activity was observed for this product." className="py-10" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {product.ads.map((ad) => (
              <AdCard
                key={ad.id}
                id={ad.id}
                platform={ad.platform}
                format={ad.creatives[0]?.format ?? "OTHER"}
                status={ad.status}
                headline={ad.creatives[0]?.headline ?? ad.offer ?? "Ad"}
                thumbnailUrl={ad.creatives[0]?.thumbnailUrl ?? null}
                lastSeenAt={ad.lastSeenAt}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Competitors selling similar products</h2>
        {similarProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other tracked stores currently carry a similarly named product.</p>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.store.name}</p>
                  </div>
                  {p.price !== null && <Badge variant="secondary">{formatCurrency(p.price, p.currency)}</Badge>}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
