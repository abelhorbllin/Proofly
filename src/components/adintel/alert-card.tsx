"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_TONE: Record<string, "success" | "warning" | "info" | "danger" | "secondary"> = {
  NEW_AD: "info",
  NEW_PRODUCT: "info",
  PRICE_CHANGE: "warning",
  CREATIVE_CHANGE: "info",
  STORE_CHANGE: "secondary",
  AD_STOPPED: "danger",
  AD_STARTED: "success",
  TRAFFIC_CHANGE: "warning",
  SIGNIFICANT_ACTIVITY_CHANGE: "warning",
};

function entityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  const map: Record<string, string> = { STORE: "/stores", PRODUCT: "/products", AD: "/ads", COMPETITOR: "/competitors" };
  const base = map[entityType];
  return base ? `${base}/${entityId}` : null;
}

export function AlertCard({
  id,
  type,
  title,
  body,
  createdAt,
  read: initialRead,
  entityType,
  entityId,
}: {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: Date | string;
  read: boolean;
  entityType: string | null;
  entityId: string | null;
}) {
  const [read, setRead] = useState(initialRead);
  const href = entityHref(entityType, entityId);

  async function markRead() {
    setRead(true);
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
  }

  return (
    <Card className={read ? "opacity-70" : undefined}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={TYPE_TONE[type] ?? "secondary"}>{type.replace(/_/g, " ")}</Badge>
            {!read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {href && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={href}>
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {!read && (
            <Button variant="outline" size="sm" onClick={markRead}>
              <Check className="h-3.5 w-3.5" /> Mark read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
