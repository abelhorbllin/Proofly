import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { getAdDataProvider } from "@/lib/providers";

const BodySchema = z.object({ query: z.string().min(2) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a product name or keyword." }, { status: 400 });

  const provider = getAdDataProvider();
  const ads = await provider.searchAds(parsed.data.query);
  return NextResponse.json({ ads });
}
