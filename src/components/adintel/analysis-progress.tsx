"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStepState {
  key: string;
  label: string;
  status: "pending" | "active" | "done";
}

export function AnalysisProgress({ steps }: { steps: ProgressStepState[] }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
      {steps.map((step) => (
        <div key={step.key} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              step.status === "done" && "border-success bg-success/15 text-success",
              step.status === "active" && "border-primary bg-primary/15 text-primary",
              step.status === "pending" && "border-border text-muted-foreground"
            )}
          >
            {step.status === "done" && <Check className="h-3 w-3" />}
            {step.status === "active" && <Loader2 className="h-3 w-3 animate-spin" />}
          </span>
          <span className={cn(step.status === "pending" ? "text-muted-foreground" : "text-foreground")}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
