import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AIStrategyPanel } from "@/components/adintel/ai-strategy-panel";
import { AIChat } from "@/components/adintel/ai-chat";
import type { Strategy } from "@/lib/ai/schemas";

export default async function AIPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const latestStrategy = await db.aIInsight.findFirst({
    where: { organizationId, type: "STRATEGY" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Strategy &amp; Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI interprets the evidence ADINTEL gathers. It never guarantees outcomes and will say so when data is
          insufficient.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AIStrategyPanel initial={(latestStrategy?.content as Strategy) ?? null} />
        <AIChat />
      </div>
    </div>
  );
}
