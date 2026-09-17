import { Suspense } from "react";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { AdFormat, AdPlatform, AdStatus, Prisma } from "@prisma/client";
import { AdsFilterBar } from "@/components/adintel/ads-filter-bar";
import { AdCard } from "@/components/adintel/ad-card";
import { EmptyState } from "@/components/adintel/empty-state";
import { Megaphone } from "lucide-react";

export default async function AdsPage({ searchParams }: PageProps<"/ads">) {
  const params = await searchParams;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const platform = typeof params.platform === "string" ? params.platform : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const format = typeof params.format === "string" ? params.format : undefined;
  const storeId = typeof params.storeId === "string" ? params.storeId : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;

  const where: Prisma.AdWhereInput = {
    store: { organizationId },
    ...(platform ? { platform: platform as AdPlatform } : {}),
    ...(status ? { status: status as AdStatus } : {}),
    ...(storeId ? { storeId } : {}),
    ...(format ? { creatives: { some: { format: format as AdFormat } } } : {}),
    ...(q
      ? {
          OR: [
            { offer: { contains: q, mode: "insensitive" } },
            { cta: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
            { creatives: { some: { headline: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const ads = await db.ad.findMany({
    where,
    orderBy: { lastSeenAt: "desc" },
    take: 60,
    include: { creatives: { take: 1, orderBy: { firstSeenAt: "desc" } }, product: true, store: true },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ad library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every ad observed across your analyzed and tracked stores.</p>
      </div>

      <Suspense>
        <AdsFilterBar />
      </Suspense>

      {ads.length === 0 ? (
        <EmptyState icon={Megaphone} title="No ad data available" description="Analyze a store to start building your ad library." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ads.map((ad) => (
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
    </div>
  );
}
