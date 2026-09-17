"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OPTIONS: { key: string; label: string }[] = [
  { key: "trackNewAds", label: "New ads" },
  { key: "trackNewProducts", label: "New products" },
  { key: "trackPriceChanges", label: "Price changes" },
  { key: "trackLandingPages", label: "Landing page changes" },
  { key: "trackStoreChanges", label: "Store changes" },
  { key: "trackCreatives", label: "Creative changes" },
  { key: "trackAdStatus", label: "Ad status changes" },
];

export function TrackingSettings({
  competitorId,
  initial,
}: {
  competitorId: string;
  initial: Record<string, boolean>;
}) {
  const [settings, setSettings] = useState(initial);

  async function toggle(key: string, value: boolean) {
    setSettings((s) => ({ ...s, [key]: value }));
    const res = await fetch(`/api/competitors/${competitorId}/tracking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (!res.ok) {
      toast.error("Could not update tracking setting.");
      setSettings((s) => ({ ...s, [key]: !value }));
    }
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((opt) => (
        <div key={opt.key} className="flex items-center justify-between">
          <Label className="text-sm font-normal">{opt.label}</Label>
          <Switch checked={settings[opt.key] ?? true} onCheckedChange={(v) => toggle(opt.key, v)} />
        </div>
      ))}
    </div>
  );
}
