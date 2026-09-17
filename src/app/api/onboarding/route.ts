import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { generateStoreAnalysis } from "@/lib/analysis/generate-store-analysis";

const OnboardingSchema = z.object({
  businessType: z.enum(["DROPSHIPPING", "SHOPIFY_BRAND", "DTC", "AGENCY", "OTHER"]),
  mainMarket: z.enum(["FRANCE", "EUROPE", "USA", "UK", "WORLDWIDE"]),
  mainGoal: z.enum(["FIND_OPPORTUNITIES", "VALIDATE_PRODUCTS", "ANALYZE_COMPETITORS", "ANALYZE_ADS", "MONITOR_COMPETITORS"]),
  storeUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = OnboardingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding data." }, { status: 400 });
  }

  const { businessType, mainMarket, mainGoal, storeUrl } = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      businessType,
      mainMarket,
      mainGoal,
      storeUrl: storeUrl || null,
      onboardingComplete: true,
    },
  });

  let firstStoreId: string | null = null;
  if (storeUrl && session.user.organizationId) {
    try {
      const store = await generateStoreAnalysis(session.user.organizationId, storeUrl);
      firstStoreId = store.id;
    } catch {
      // Non-fatal: onboarding still completes without a first analysis.
    }
  }

  return NextResponse.json({ ok: true, firstStoreId });
}
