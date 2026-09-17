import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

const BodySchema = z.object({ name: z.string().min(1).max(120) });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  return NextResponse.json({ user: { name: user.name } });
}
