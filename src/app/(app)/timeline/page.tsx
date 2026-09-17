import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/adintel/empty-state";
import { History } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export default async function TimelinePage({ searchParams }: PageProps<"/timeline">) {
  const params = await searchParams;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const storeId = typeof params.storeId === "string" ? params.storeId : undefined;
  const competitorId = typeof params.competitorId === "string" ? params.competitorId : undefined;

  const where: Prisma.TimelineEventWhereInput = {
    OR: [
      { store: { organizationId } },
      { competitor: { organizationId } },
      { product: { store: { organizationId } } },
      { ad: { store: { organizationId } } },
    ],
    ...(storeId ? { storeId } : {}),
    ...(competitorId ? { competitorId } : {}),
  };

  const events = await db.timelineEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: 150,
    include: { store: true, competitor: true, product: true },
  });

  const grouped = new Map<string, typeof events>();
  for (const e of events) {
    const key = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(e.occurredAt);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">A chronological record of every change ADINTEL has detected.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={History} title="No activity recorded yet" description="Analyze and track stores to start building a historical timeline." />
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([month, monthEvents]) => (
            <div key={month}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{month}</p>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {monthEvents.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {e.store?.name ?? e.competitor?.name ?? e.product?.name ?? ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(e.occurredAt)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
