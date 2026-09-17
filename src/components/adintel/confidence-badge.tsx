import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG = {
  LOW: { label: "Low confidence", className: "bg-warning/15 text-warning" },
  MEDIUM: { label: "Medium confidence", className: "bg-info/15 text-info" },
  HIGH: { label: "High confidence", className: "bg-success/15 text-success" },
} as const;

export function ConfidenceBadge({ level, className }: { level: "LOW" | "MEDIUM" | "HIGH"; className?: string }) {
  const config = CONFIG[level];
  return <Badge variant="outline" className={cn("border-transparent font-medium", config.className, className)}>{config.label}</Badge>;
}
