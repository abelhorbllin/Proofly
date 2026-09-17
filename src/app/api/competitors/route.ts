import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { assertUsageAvailable, incrementUsage, UsageLimitError } from "@/lib/billing/usage";

const BodySchema = z.object({ storeId: z.string() });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const organizationId = session.user.organizationId;
  const store = await db.store.findFirst({ where: { id: parsed.data.storeId, organizationId } });
  if (!store) return NextResponse.json({ error: "Store not found." }, { status: 404 });

  const existing = await db.competitor.findUnique({ where: { storeId: store.id } });
  if (existing) {
    const updated = await db.competitor.update({ where: { id: existing.id }, data: { tracked: true } });
    if (!existing.tracked) {
      await db.tracking.upsert({ where: { competitorId: updated.id }, update: { enabled: true }, create: { competitorId: updated.id } });
    }
    return NextResponse.json({ competitor: updated });
  }

  try {
    await assertUsageAvailable(organizationId, "competitorsTracked");
  } catch (err) {
    if (err instanceof UsageLimitError) {
      return NextResponse.json({ error: err.message, code: "USAGE_LIMIT" }, { status: 402 });
    }
    throw err;
  }

  const competitor = await db.competitor.create({
    data: {
      organizationId,
      storeId: store.id,
      name: store.name,
      domain: store.domain,
      category: store.category,
      tracked: true,
    },
  });
  await db.tracking.create({ data: { competitorId: competitor.id } });
  await incrementUsage(organizationId, "competitorsTracked");

  return NextResponse.json({ competitor });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ competitors: [] });

  const competitors = await db.competitor.findMany({
    where: { organizationId: session.user.organizationId },
    include: { store: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ competitors });
}
