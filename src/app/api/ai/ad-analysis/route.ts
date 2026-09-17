import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";

const BodySchema = z.object({ creativeId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const creative = await db.adCreative.findFirst({
    where: { id: parsed.data.creativeId, ad: { store: { organizationId } } },
    include: { ad: { include: { product: true } }, analysis: true },
  });
  if (!creative) return NextResponse.json({ error: "Creative not found." }, { status: 404 });

  if (creative.analysis) {
    return NextResponse.json({ analysis: creative.analysis });
  }

  try {
    await assertUsageAvailable(organizationId, "aiAnalyses");

    const { result, model } = await aiService.analyzeAdCreative({
      hook: creative.hook ?? "",
      headline: creative.headline ?? "",
      primaryText: creative.primaryText ?? "",
      format: creative.format,
      platform: creative.ad.platform,
      offer: creative.ad.offer ?? "",
      cta: creative.ad.cta ?? "",
      productName: creative.ad.product?.name,
    });

    await incrementUsage(organizationId, "aiAnalyses");

    const analysis = await db.adAnalysis.create({
      data: {
        creativeId: creative.id,
        summary: result.summary,
        hookAnalysis: result.hookAnalysis,
        visualAnalysis: result.visualAnalysis,
        offerAnalysis: result.offerAnalysis,
        ctaAnalysis: result.ctaAnalysis,
        audienceHypothesis: result.audienceHypothesis,
        angleClassification: result.angleClassification,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        objections: result.objections,
        improvements: result.improvements,
        testingIdeas: result.testingIdeas,
        confidence: result.confidence,
        model,
      },
    });

    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Ad analysis failed", err);
    return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 500 });
  }
}
