import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { computeStoreSignals, daysBetween } from "@/lib/analysis/compute-signals";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";
import type { ValidationReport } from "@/lib/validation/types";
import type { StoreReportData } from "@/lib/pdf/report-template";

const BodySchema = z.object({
  type: z.enum(["STORE_ANALYSIS", "PRODUCT_VALIDATION"]),
  targetEntityId: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const { type, targetEntityId } = parsed.data;

  try {
    await assertUsageAvailable(organizationId, "reportsGenerated");

    let title: string;
    let content: StoreReportData | ValidationReport;

    if (type === "STORE_ANALYSIS") {
      const store = await db.store.findFirst({
        where: { id: targetEntityId, organizationId },
        include: {
          _count: { select: { products: true, ads: true } },
          revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
          trafficEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

      const [activeAdCount, distinctAngles] = await Promise.all([
        db.ad.count({ where: { storeId: store.id, status: "ACTIVE" } }),
        db.ad.findMany({ where: { storeId: store.id }, select: { angle: true }, distinct: ["angle"] }),
      ]);

      const signals = computeStoreSignals({
        activeAdCount,
        totalAdCount: store._count.ads,
        productCount: store._count.products,
        distinctAngles: distinctAngles.filter((a) => a.angle).length,
        daysSinceFirstObserved: store.firstObservedAt ? daysBetween(store.firstObservedAt, new Date()) : 0,
        trafficConfidence: store.trafficEstimates[0]?.confidence ?? "LOW",
      });

      title = `Store Analysis — ${store.name}`;
      content = {
        name: store.name,
        domain: store.domain,
        category: store.category,
        platform: store.platform,
        country: store.country,
        currency: store.currency,
        productCount: store._count.products,
        activeAdCount,
        totalAdCount: store._count.ads,
        signals,
        revenue: store.revenueEstimates[0]
          ? {
              monthlyLow: store.revenueEstimates[0].monthlyLow,
              monthlyHigh: store.revenueEstimates[0].monthlyHigh,
              confidence: store.revenueEstimates[0].confidence,
              methodology: store.revenueEstimates[0].methodology,
            }
          : null,
        traffic: store.trafficEstimates[0]
          ? {
              monthlyVisitsLow: store.trafficEstimates[0].monthlyVisitsLow,
              monthlyVisitsHigh: store.trafficEstimates[0].monthlyVisitsHigh,
              confidence: store.trafficEstimates[0].confidence,
            }
          : null,
      };
    } else {
      const validation = await db.productValidation.findFirst({ where: { id: targetEntityId, userId: session.user.id } });
      if (!validation) return NextResponse.json({ error: "Validation not found." }, { status: 404 });
      title = `Product Validation — ${validation.productName}`;
      content = validation.result as unknown as ValidationReport;
    }

    await incrementUsage(organizationId, "reportsGenerated");

    const report = await db.report.create({
      data: {
        organizationId,
        userId: session.user.id,
        type,
        title,
        targetEntityType: type === "STORE_ANALYSIS" ? "STORE" : "PRODUCT_VALIDATION",
        targetEntityId,
        content: content as never,
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Report generation failed", err);
    return NextResponse.json({ error: "We couldn't generate this report. Please try again." }, { status: 500 });
  }
}
