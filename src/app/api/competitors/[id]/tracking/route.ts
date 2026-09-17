import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

const BodySchema = z.object({
  trackNewAds: z.boolean().optional(),
  trackNewProducts: z.boolean().optional(),
  trackPriceChanges: z.boolean().optional(),
  trackLandingPages: z.boolean().optional(),
  trackStoreChanges: z.boolean().optional(),
  trackCreatives: z.boolean().optional(),
  trackAdStatus: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: RouteContext<"/api/competitors/[id]/tracking">) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const competitor = await db.competitor.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!competitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const tracking = await db.tracking.upsert({
    where: { competitorId: competitor.id },
    update: parsed.data,
    create: { competitorId: competitor.id, ...parsed.data },
  });

  return NextResponse.json({ tracking });
}
