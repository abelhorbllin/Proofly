import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ results: [] });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const organizationId = session.user.organizationId;

  if (q.length < 2) return NextResponse.json({ results: [] });

  const [stores, products, competitors] = await Promise.all([
    db.store.findMany({
      where: { organizationId, OR: [{ name: { contains: q, mode: "insensitive" } }, { domain: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    db.product.findMany({
      where: { store: { organizationId }, name: { contains: q, mode: "insensitive" } },
      take: 5,
      include: { store: true },
    }),
    db.competitor.findMany({
      where: { organizationId, OR: [{ name: { contains: q, mode: "insensitive" } }, { domain: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
  ]);

  const results = [
    ...stores.map((s) => ({ type: "Store", id: s.id, title: s.name, subtitle: s.domain, href: `/stores/${s.id}` })),
    ...products.map((p) => ({ type: "Product", id: p.id, title: p.name, subtitle: p.store.name, href: `/products/${p.id}` })),
    ...competitors.map((c) => ({ type: "Competitor", id: c.id, title: c.name, subtitle: c.domain, href: `/competitors/${c.id}` })),
  ];

  return NextResponse.json({ results });
}
