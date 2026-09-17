import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = session.user.organizationId;

  try {
    await assertUsageAvailable(organizationId, "aiAnalyses");

    const competitors = await db.competitor.findMany({
      where: { organizationId, tracked: true },
      include: {
        store: {
          include: {
            ads: { select: { angle: true } },
            products: { select: { price: true } },
          },
        },
      },
    });

    const competitorNames = competitors.map((c) => c.name);
    const angles = Array.from(
      new Set(competitors.flatMap((c) => c.store?.ads.map((a) => a.angle).filter((a): a is NonNullable<typeof a> => !!a) ?? []))
    );
    const prices = competitors.flatMap((c) => c.store?.products.map((p) => p.price).filter((p): p is number => p !== null) ?? []);
    const priceRangeLow = prices.length ? Math.min(...prices) : 0;
    const priceRangeHigh = prices.length ? Math.max(...prices) : 0;
    const currency = competitors[0]?.store?.currency ?? "EUR";

    const { result, model } = await aiService.generateStrategy({
      competitorNames,
      commonAnglesObserved: angles,
      priceRangeLow,
      priceRangeHigh,
      currency,
    });

    await incrementUsage(organizationId, "aiAnalyses");

    const insight = await db.aIInsight.create({
      data: { organizationId, type: "STRATEGY", content: result, confidence: result.confidence, model },
    });

    return NextResponse.json({ insight });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Strategy generation failed", err);
    return NextResponse.json({ error: "AI strategy generation failed. Please try again." }, { status: 500 });
  }
}
