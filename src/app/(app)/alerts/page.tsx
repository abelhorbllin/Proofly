import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AlertCard } from "@/components/adintel/alert-card";
import { MarkAllReadButton } from "@/components/adintel/mark-all-read-button";
import { EmptyState } from "@/components/adintel/empty-state";
import { Bell } from "lucide-react";

export default async function AlertsPage() {
  const session = await requireSession();
  const organizationId = session.user.organizationId!;

  const alerts = await db.alert.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} — changes detected across your tracked competitors.
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" description="Track a competitor to start receiving change alerts." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertCard
              key={a.id}
              id={a.id}
              type={a.type}
              title={a.title}
              body={a.body}
              createdAt={a.createdAt}
              read={a.read}
              entityType={a.entityType}
              entityId={a.entityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
