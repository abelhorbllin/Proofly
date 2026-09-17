import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export function AdCard({
  id,
  platform,
  format,
  status,
  headline,
  thumbnailUrl,
  lastSeenAt,
  productName,
}: {
  id: string;
  platform: string;
  format: string;
  status: "ACTIVE" | "INACTIVE";
  headline: string;
  thumbnailUrl: string | null;
  lastSeenAt: Date;
  productName?: string | null;
}) {
  return (
    <Link href={`/ads/${id}`}>
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/40">
        <div className="relative aspect-square bg-surface-2">
          {thumbnailUrl && <Image src={thumbnailUrl} alt={headline} fill className="object-cover" unoptimized />}
          {format === "VIDEO" && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
                <Play className="h-3.5 w-3.5 fill-white text-white" />
              </span>
            </span>
          )}
          <Badge variant={status === "ACTIVE" ? "success" : "secondary"} className="absolute left-2 top-2">
            {status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardContent className="p-3">
          <p className="truncate text-sm font-medium">{headline}</p>
          {productName && <p className="truncate text-xs text-muted-foreground">{productName}</p>}
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{platform}</span>
            <span>{timeAgo(lastSeenAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
