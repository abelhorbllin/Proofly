"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await fetch("/api/alerts/read-all", { method: "POST" });
        router.refresh();
      }}
    >
      <CheckCheck className="h-4 w-4" /> Mark all read
    </Button>
  );
}
