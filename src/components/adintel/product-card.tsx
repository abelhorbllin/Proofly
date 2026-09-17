import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({
  id,
  name,
  price,
  compareAtPrice,
  currency,
  image,
  adCount,
}: {
  id: string;
  name: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  image?: string | null;
  adCount?: number;
}) {
  return (
    <Link href={`/products/${id}`}>
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/40">
        <div className="relative aspect-square bg-surface-2">
          {image && <Image src={image} alt={name} fill className="object-cover" unoptimized />}
        </div>
        <CardContent className="p-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="mt-1 flex items-center gap-2">
            {price !== null && <span className="text-sm font-semibold">{formatCurrency(price, currency)}</span>}
            {compareAtPrice && <span className="text-xs text-muted-foreground line-through">{formatCurrency(compareAtPrice, currency)}</span>}
          </div>
          {typeof adCount === "number" && <p className="mt-1 text-[11px] text-muted-foreground">{adCount} ads observed</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
