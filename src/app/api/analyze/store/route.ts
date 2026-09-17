import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { generateStoreAnalysis } from "@/lib/analysis/generate-store-analysis";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";

const BodySchema = z.object({ url: z.string().min(3) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid store URL." }, { status: 400 });
  }

  const organizationId = session.user.organizationId;

  try {
    await assertUsageAvailable(organizationId, "storeAnalyses");
    const store = await generateStoreAnalysis(organizationId, parsed.data.url);
    await incrementUsage(organizationId, "storeAnalyses");
    return NextResponse.json({ storeId: store.id });
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    console.error("Store analysis failed", err);
    return NextResponse.json({ error: "We couldn't analyze this store right now. Please try again." }, { status: 500 });
  }
}
