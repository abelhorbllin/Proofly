import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { startUpgrade } from "@/lib/billing/subscription-service";

const BodySchema = z.object({ plan: z.enum(["PRO", "AGENCY"]) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const { url, mock } = await startUpgrade(session.user.organizationId, session.user.email, parsed.data.plan);
  return NextResponse.json({ url, mock });
}
