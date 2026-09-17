import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

const BodySchema = z.object({
  entityType: z.enum(["STORE", "PRODUCT", "AD", "COMPETITOR"]),
  entityId: z.string(),
  folder: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { entityType, entityId, folder } = parsed.data;
  const entityFields = {
    storeId: entityType === "STORE" ? entityId : undefined,
    productId: entityType === "PRODUCT" ? entityId : undefined,
    adId: entityType === "AD" ? entityId : undefined,
    competitorId: entityType === "COMPETITOR" ? entityId : undefined,
  };

  const existing = await db.savedItem.findFirst({
    where: { userId: session.user.id, entityType, ...entityFields },
  });

  if (existing) {
    await db.savedItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await db.savedItem.create({
    data: {
      userId: session.user.id,
      entityType,
      folder: folder ?? "General",
      ...entityFields,
    },
  });
  return NextResponse.json({ saved: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  const items = await db.savedItem.findMany({
    where: { userId: session.user.id },
    include: { store: true, product: { include: { store: true } }, ad: { include: { store: true } }, competitor: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}
