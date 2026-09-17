import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.alert.updateMany({ where: { organizationId: session.user.organizationId, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
