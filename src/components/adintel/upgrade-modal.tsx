"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function UpgradeModal({
  open,
  onOpenChange,
  metric,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle>You&apos;ve reached your plan limit</DialogTitle>
          <DialogDescription>
            {metric ? `You've used all available ${metric} for this billing period on your current plan.` : "You've used all available usage for this billing period on your current plan."}{" "}
            Upgrade to keep analyzing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/settings/billing">View plans</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
