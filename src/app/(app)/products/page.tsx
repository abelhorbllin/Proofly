import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/adintel/product-card";
import { EmptyState } from "@/components/adintel/empty-state";
import { Package } from "lucide-react";

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;
  const storeId = typeof params.storeId === "string" ? params.storeId : undefined;

  const products = await db.product.findMany({
    where: { store: { organizationId }, ...(storeId ? { storeId } : {}) },
    orderBy: { lastObservedAt: "desc" },
    take: 60,
    include: { store: true, _count: { select: { ads: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every product detected across your analyzed stores.</p>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products detected yet" description="Analyze a store to start tracking its products." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
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
    </div>
  );
}
