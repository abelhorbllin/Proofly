import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";

const BodySchema = z.object({ storeAId: z.string(), storeBId: z.string() });

async function loadStoreFacts(storeId: string, organizationId: string) {
  const store = await db.store.findFirst({
    where: { id: storeId, organizationId },
    include: {
      _count: { select: { products: true, ads: { where: { status: "ACTIVE" } } } },
      revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
      trafficEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
      products: { select: { price: true } },
    },
  });
  if (!store) return null;

  const prices = store.products.map((p) => p.price).filter((p): p is number => p !== null);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const creativeFormats = await db.adCreative.findMany({ where: { ad: { storeId: store.id } }, select: { format: true }, distinct: ["format"] });
  const videoCount = await db.adCreative.count({ where: { ad: { storeId: store.id }, format: "VIDEO" } });

  return {
    id: store.id,
    name: store.name,
    domain: store.domain,
    category: store.category,
    productCount: store._count.products,
    activeAdCount: store._count.ads,
    avgPrice,
    currency: store.currency,
    trafficLow: store.trafficEstimates[0]?.monthlyVisitsLow ?? null,
    trafficHigh: store.trafficEstimates[0]?.monthlyVisitsHigh ?? null,
    revenueLow: store.revenueEstimates[0]?.monthlyLow ?? null,
    revenueHigh: store.revenueEstimates[0]?.monthlyHigh ?? null,
    formatCount: creativeFormats.length,
    videoCount,
  };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select two stores to compare." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const [a, b] = await Promise.all([
    loadStoreFacts(parsed.data.storeAId, organizationId),
    loadStoreFacts(parsed.data.storeBId, organizationId),
  ]);
  if (!a || !b) return NextResponse.json({ error: "One or both stores could not be found." }, { status: 404 });

  const facts: string[] = [
    `${a.name} has ${a.productCount} tracked products vs ${b.name}'s ${b.productCount}.`,
    `${a.name} has ${a.activeAdCount} active ads vs ${b.name}'s ${b.activeAdCount}.`,
    a.avgPrice !== null && b.avgPrice !== null
      ? `${a.name}'s average observed price is ${formatCurrency(a.avgPrice, a.currency)} vs ${b.name}'s ${formatCurrency(b.avgPrice, b.currency)}.`
      : "Average pricing could not be compared due to insufficient data.",
    a.trafficLow !== null && b.trafficLow !== null
      ? `${a.name}'s estimated traffic is ${formatCompactNumber(a.trafficLow)}–${formatCompactNumber(a.trafficHigh!)} vs ${b.name}'s ${formatCompactNumber(b.trafficLow)}–${formatCompactNumber(b.trafficHigh!)}.`
      : "Traffic could not be compared due to insufficient data.",
    `${a.name} uses ${a.videoCount} video creatives vs ${b.name}'s ${b.videoCount}.`,
  ];

  const { result } = await aiService.generateComparison({ storeAName: a.name, storeBName: b.name, facts });

  await db.competitorComparison.create({
    data: { organizationId, myStoreUrl: a.domain, competitorId: null, result: { a, b, facts, aiSummary: result } as never },
  });

  return NextResponse.json({ a, b, facts, aiSummary: result });
}
