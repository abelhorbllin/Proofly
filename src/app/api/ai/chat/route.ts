import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { aiService } from "@/lib/ai/ai-service";
import { incrementUsage } from "@/lib/billing/usage";

const BodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const organizationId = session.user.organizationId;

  const [stores, competitors, alerts] = await Promise.all([
    db.store.findMany({
      where: { organizationId },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { products: true, ads: { where: { status: "ACTIVE" } } } },
        revenueEstimates: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    db.competitor.findMany({ where: { organizationId, tracked: true }, take: 10 }),
    db.alert.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const context = [
    "Analyzed stores:",
    ...stores.map(
      (s) =>
        `- ${s.name} (${s.domain}, ${s.category ?? "uncategorized"}): ${s._count.products} products, ${s._count.ads} active ads observed${
          s.revenueEstimates[0]
            ? `, estimated monthly revenue ${s.revenueEstimates[0].monthlyLow}-${s.revenueEstimates[0].monthlyHigh} ${s.currency}`
            : ", revenue could not be estimated"
        }.`
    ),
    "",
    "Tracked competitors:",
    ...(competitors.length ? competitors.map((c) => `- ${c.name} (${c.domain})`) : ["None tracked yet."]),
    "",
    "Recent alerts:",
    ...(alerts.length ? alerts.map((a) => `- ${a.title}: ${a.body}`) : ["None."]),
  ].join("\n");

  const { content, model } = await aiService.chat(parsed.data.messages, context);
  await incrementUsage(organizationId, "aiAnalyses");

  return NextResponse.json({ content, model });
}
