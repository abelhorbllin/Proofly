"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/adintel/upgrade-modal";
import { Radar, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TrackCompetitorButton({ storeId, initiallyTracked }: { storeId: string; initiallyTracked: boolean }) {
  const [tracked, setTracked] = useState(initiallyTracked);
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const router = useRouter();

  async function track() {
    setLoading(true);
    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "USAGE_LIMIT") setUpgradeOpen(true);
      else toast.error(data.error ?? "Could not track this competitor.");
      return;
    }
    setTracked(true);
    toast.success("Now tracking this competitor.");
    router.refresh();
  }

  if (tracked) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <Check className="h-4 w-4" /> Tracking
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={track} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
        Track competitor
      </Button>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} metric="tracked competitors" />
    </>
  );
}
