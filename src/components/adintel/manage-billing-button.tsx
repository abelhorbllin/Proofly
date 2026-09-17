"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Billing portal unavailable.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button variant="outline" size="sm" onClick={openPortal} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      Manage billing
    </Button>
  );
}
