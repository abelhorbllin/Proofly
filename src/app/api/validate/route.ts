import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { computeUnitEconomics } from "@/lib/calculations/unit-economics";
import { generateStoreAnalysis } from "@/lib/analysis/generate-store-analysis";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";
import type { ValidationReport, ValidationCompetitor } from "@/lib/validation/types";
import type { Signal } from "@/lib/analysis/compute-signals";

const BodySchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  productUrl: z.string().optional(),
  competitorStoreUrl: z.string().optional(),
  sellingPrice: z.number().positive(),
  productCost: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  targetMarket: z.enum(["FRANCE", "EUROPE", "USA", "UK", "WORLDWIDE"]).optional(),
  expectedConversion: z.number().min(0).max(100).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the validation form for errors." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const input = parsed.data;

  try {
    await assertUsageAvailable(organizationId, "productValidations");

    if (input.competitorStoreUrl) {
      try {
        await generateStoreAnalysis(organizationId, input.competitorStoreUrl);
      } catch {
        // Non-fatal — validation continues with whatever evidence is already tracked.
      }
    }

    const keyword = input.productName.split(" ")[0];
    const matchedProducts = await db.product.findMany({
      where: { store: { organizationId }, name: { contains: keyword, mode: "insensitive" } },
      include: {
        store: { include: { revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 }, trafficEstimates: { orderBy: { createdAt: "desc" }, take: 1 } } },
        ads: { include: { creatives: true } },
      },
      take: 20,
    });

    const storeMap = new Map<string, (typeof matchedProducts)[number]["store"]>();
    for (const p of matchedProducts) storeMap.set(p.storeId, p.store);

    const competitorActivity: ValidationCompetitor[] = Array.from(storeMap.values()).map((store) => {
      const productsForStore = matchedProducts.filter((p) => p.storeId === store.id);
      const ads = productsForStore.flatMap((p) => p.ads);
      return {
        storeId: store.id,
        name: store.name,
        domain: store.domain,
        activeAds: ads.filter((a) => a.status === "ACTIVE").length,
        totalAds: ads.length,
        platforms: Array.from(new Set(ads.map((a) => a.platform))),
        price: productsForStore[0]?.price ?? null,
        currency: store.currency,
      };
    });

    const allAds = matchedProducts.flatMap((p) => p.ads);
    const activeAds = allAds.filter((a) => a.status === "ACTIVE");
    const formats: Record<string, number> = {};
    for (const ad of allAds) {
      for (const c of ad.creatives) {
        formats[c.format] = (formats[c.format] ?? 0) + 1;
      }
    }
    const angles = Array.from(new Set(allAds.map((a) => a.angle).filter((a): a is NonNullable<typeof a> => !!a)));
    const offers = Array.from(new Set(allAds.map((a) => a.offer).filter((o): o is string => !!o)));
    const ctas = Array.from(new Set(allAds.map((a) => a.cta).filter((c): c is string => !!c)));

    const productLongevityDays =
      matchedProducts.length > 0
        ? Math.max(
            ...matchedProducts.map((p) =>
              p.firstObservedAt ? Math.round((Date.now() - p.firstObservedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
            )
          )
        : 0;

    const prices = matchedProducts.map((p) => p.price).filter((p): p is number => p !== null);
    const priceLow = prices.length ? Math.min(...prices) : null;
    const priceHigh = prices.length ? Math.max(...prices) : null;
    const pricePositioning =
      priceLow !== null && priceHigh !== null
        ? input.sellingPrice < priceLow
          ? "Below observed competitor range"
          : input.sellingPrice > priceHigh
            ? "Above observed competitor range"
            : "Within observed competitor range"
        : "Insufficient public data";

    const marketSignals: Signal[] = [
      {
        label: "Advertising activity",
        value: activeAds.length >= 6 ? "STRONG" : activeAds.length >= 2 ? "MEDIUM" : "WEAK",
        explanation: `${activeAds.length} active ads observed across ${competitorActivity.length} competitor store${competitorActivity.length === 1 ? "" : "s"}.`,
      },
      {
        label: "Competitor density",
        value: competitorActivity.length >= 4 ? "STRONG" : competitorActivity.length >= 2 ? "MEDIUM" : "WEAK",
        explanation: `${competitorActivity.length} tracked stores observed selling this or a similar product.`,
      },
      {
        label: "Creative diversity",
        value: angles.length >= 4 ? "STRONG" : angles.length >= 2 ? "MEDIUM" : "WEAK",
        explanation: `${angles.length} distinct advertising angles observed.`,
      },
      {
        label: "Product persistence",
        value: productLongevityDays >= 120 ? "STRONG" : productLongevityDays >= 30 ? "MEDIUM" : "WEAK",
        explanation: `Longest observed listing has been active for approximately ${productLongevityDays} days.`,
      },
      {
        label: "Price positioning",
        value: pricePositioning === "Within observed competitor range" ? "STRONG" : pricePositioning === "Insufficient public data" ? "WEAK" : "MEDIUM",
        explanation: pricePositioning,
      },
      {
        label: "Market saturation",
        value: competitorActivity.length >= 5 ? "STRONG" : competitorActivity.length >= 2 ? "MEDIUM" : "WEAK",
        explanation: `${competitorActivity.length} competitor store${competitorActivity.length === 1 ? "" : "s"} currently active in this product category.`,
      },
    ];

    const storesWithRevenue = Array.from(storeMap.values()).filter((s) => s.revenueEstimates.length > 0);
    const businessEstimates =
      storesWithRevenue.length > 0
        ? (() => {
            const revs = storesWithRevenue.map((s) => s.revenueEstimates[0]);
            const traffics = Array.from(storeMap.values()).flatMap((s) => s.trafficEstimates);
            return {
              trafficLow: traffics.length ? Math.min(...traffics.map((t) => t.monthlyVisitsLow)) : 0,
              trafficHigh: traffics.length ? Math.max(...traffics.map((t) => t.monthlyVisitsHigh)) : 0,
              revenueLow: Math.min(...revs.map((r) => r.monthlyLow)),
              revenueHigh: Math.max(...revs.map((r) => r.monthlyHigh)),
              adSpendLow: Math.min(...revs.map((r) => r.adSpendMonthlyLow ?? 0)),
              adSpendHigh: Math.max(...revs.map((r) => r.adSpendMonthlyHigh ?? 0)),
              confidence: "LOW" as const,
              currency: storesWithRevenue[0].currency,
            };
          })()
        : null;

    const unitEconomics =
      input.productCost !== undefined
        ? {
            ...computeUnitEconomics({
              sellingPrice: input.sellingPrice,
              productCost: input.productCost,
              shippingCost: input.shippingCost ?? 0,
              paymentFeePct: 2.9,
              refundRatePct: 5,
            }),
            sellingPrice: input.sellingPrice,
            productCost: input.productCost,
            shippingCost: input.shippingCost ?? 0,
          }
        : null;

    const dataConfidence: "LOW" | "MEDIUM" | "HIGH" = competitorActivity.length >= 3 && businessEstimates ? "MEDIUM" : "LOW";

    const { result: aiAssessment, model } = await aiService.generateValidationSummary({
      productName: input.productName,
      sellingPrice: input.sellingPrice,
      competitorCount: competitorActivity.length,
      adCount: allAds.length,
      activeAdCount: activeAds.length,
      angleVariety: angles.length,
      grossMarginPct: unitEconomics?.grossMarginPct ?? null,
      dataConfidence,
    });

    const report: ValidationReport = {
      productName: input.productName,
      productUrl: input.productUrl ?? null,
      sellingPrice: input.sellingPrice,
      currency: storesWithRevenue[0]?.currency ?? "EUR",
      marketSignals,
      competitorActivity,
      adSignals: { totalAds: allAds.length, activeAds: activeAds.length, formats, angles, offers, ctas },
      businessEstimates,
      unitEconomics,
      aiAssessment,
      generatedAt: new Date().toISOString(),
    };

    await incrementUsage(organizationId, "productValidations");
    await incrementUsage(organizationId, "aiAnalyses");

    const validation = await db.productValidation.create({
      data: {
        userId: session.user.id,
        productId: input.productId,
        productName: input.productName,
        productUrl: input.productUrl,
        competitorStoreUrl: input.competitorStoreUrl,
        sellingPrice: input.sellingPrice,
        productCost: input.productCost,
        shippingCost: input.shippingCost,
        targetMarket: input.targetMarket,
        expectedConversion: input.expectedConversion,
        result: report as never,
      },
    });

    void model;
    return NextResponse.json({ validationId: validation.id, report });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Product validation failed", err);
    return NextResponse.json({ error: "We couldn't complete this validation. Please try again." }, { status: 500 });
  }
}
