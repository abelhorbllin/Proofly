import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: RouteContext<"/api/stores/[id]/first-product">) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ productId: null }, { status: 401 });

  const { id } = await params;
  const store = await db.store.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!store) return NextResponse.json({ productId: null }, { status: 404 });

  const product = await db.product.findFirst({ where: { storeId: store.id }, orderBy: { lastObservedAt: "desc" } });
  return NextResponse.json({ productId: product?.id ?? null });
}
