import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";

const BodySchema = z.object({ storeId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const store = await db.store.findFirst({
    where: { id: parsed.data.storeId, organizationId },
    include: { _count: { select: { products: true, ads: { where: { status: "ACTIVE" } } } } },
  });
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  try {
    await assertUsageAvailable(organizationId, "aiAnalyses");

    const { result, model } = await aiService.generateStoreAudit({
      storeName: store.name,
      productCount: store._count.products,
      activeAdCount: store._count.ads,
      category: store.category ?? "General",
    });

    await incrementUsage(organizationId, "aiAnalyses");

    const insight = await db.aIInsight.create({
      data: {
        organizationId,
        type: "STORE_AUDIT",
        entityType: "STORE",
        entityId: store.id,
        content: result,
        confidence: result.confidence,
        model,
      },
    });

    return NextResponse.json({ insight });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Store audit failed", err);
    return NextResponse.json({ error: "AI audit failed. Please try again." }, { status: 500 });
  }
}
