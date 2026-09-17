import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/adintel/save-button";
import { AIAdAnalysis } from "@/components/adintel/ai-ad-analysis";
import { DataSourceBadge } from "@/components/adintel/data-source-badge";
import { Play, ExternalLink, Store as StoreIcon } from "lucide-react";
import { daysBetween } from "@/lib/analysis/compute-signals";
import { formatDate } from "@/lib/utils";

export default async function AdDetailPage({ params }: PageProps<"/ads/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const ad = await db.ad.findFirst({
    where: { id, store: { organizationId } },
    include: {
      store: true,
      product: true,
      creatives: { orderBy: { firstSeenAt: "desc" } },
    },
  });

  if (!ad) notFound();

  const creative = ad.creatives[0];
  const savedItem = await db.savedItem.findFirst({ where: { userId: session.user.id, adId: ad.id } });
  const analysis = creative
    ? await db.adAnalysis.findUnique({ where: { creativeId: creative.id } })
    : null;

  const duration = daysBetween(ad.firstSeenAt, ad.lastSeenAt);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/stores/${ad.storeId}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <StoreIcon className="h-3 w-3" /> {ad.store.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{creative?.headline ?? ad.offer ?? "Ad detail"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{ad.platform}</Badge>
            <Badge variant={ad.status === "ACTIVE" ? "success" : "secondary"}>{ad.status}</Badge>
            {ad.angle && <Badge variant="outline">{ad.angle.replace(/_/g, " ")}</Badge>}
            <DataSourceBadge type="OBSERVED" />
          </div>
        </div>
        <SaveButton entityType="AD" entityId={ad.id} initiallySaved={!!savedItem} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <div className="relative aspect-square bg-surface-2">
            {creative?.thumbnailUrl && <Image src={creative.thumbnailUrl} alt="Creative" fill className="object-cover" unoptimized />}
            {creative?.format === "VIDEO" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
                  <Play className="h-5 w-5 fill-white text-white" />
                </span>
              </span>
            )}
          </div>
          <CardContent className="space-y-3 p-4">
            {creative?.hook && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hook</p>
                <p className="text-sm">{creative.hook}</p>
              </div>
            )}
            {creative?.primaryText && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Copy</p>
                <p className="text-sm text-muted-foreground">{creative.primaryText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ad details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="First seen" value={formatDate(ad.firstSeenAt)} />
              <Detail label="Last seen" value={formatDate(ad.lastSeenAt)} />
              <Detail label="Active duration" value={`${duration} day${duration === 1 ? "" : "s"}`} />
              <Detail label="Format" value={creative?.format ?? "Unknown"} />
              <Detail label="Product" value={ad.product?.name ?? "Unknown"} />
              <Detail label="Offer" value={ad.offer ?? "None observed"} />
              <Detail label="CTA" value={ad.cta ?? "None observed"} />
              <div>
                <p className="text-xs text-muted-foreground">Landing page</p>
                {ad.landingPageUrl ? (
                  <a href={ad.landingPageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm">Unknown</p>
                )}
              </div>
            </CardContent>
          </Card>

          {ad.product && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/products/${ad.product.id}`}>View product</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-base">AI creative analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {creative ? (
            <AIAdAnalysis creativeId={creative.id} initial={analysis as never} />
          ) : (
            <p className="text-sm text-muted-foreground">No creative data available to analyze.</p>
          )}
        </CardContent>
      </Card>
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
