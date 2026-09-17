import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CompareClient } from "@/components/adintel/compare-client";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const params = await searchParams;
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const stores = await db.store.findMany({
    where: { organizationId, status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, domain: true },
  });

  const presetB = typeof params.b === "string" ? params.b : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compare stores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare observed and estimated signals between two stores. ADINTEL never declares a winner — only differences.
        </p>
      </div>
      <CompareClient stores={stores} presetB={presetB} />
    </div>
  );
}
