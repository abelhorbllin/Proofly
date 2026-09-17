import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createPortalSession } from "@/lib/billing/subscription-service";

export async function POST() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = await createPortalSession(session.user.organizationId);
  if (!url) {
    return NextResponse.json({ error: "Billing portal is not available in this environment (Stripe not configured)." }, { status: 400 });
  }
  return NextResponse.json({ url });
}
