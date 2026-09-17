import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

const BodySchema = z.object({ read: z.boolean() });

export async function PATCH(req: Request, { params }: RouteContext<"/api/alerts/[id]">) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const alert = await db.alert.findFirst({ where: { id, organizationId: session.user.organizationId } });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.alert.update({ where: { id: alert.id }, data: { read: parsed.data.read } });
  return NextResponse.json({ alert: updated });
}
