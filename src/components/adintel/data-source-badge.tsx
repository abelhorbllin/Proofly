import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Sparkles } from "lucide-react";

const CONFIG = {
  OBSERVED: { label: "Observed", icon: Eye, className: "bg-info/15 text-info" },
  ESTIMATED: { label: "Estimated", icon: TrendingUp, className: "bg-warning/15 text-warning" },
  AI: { label: "AI analysis", icon: Sparkles, className: "bg-primary/15 text-primary" },
} as const;

export function DataSourceBadge({ type }: { type: keyof typeof CONFIG }) {
  const config = CONFIG[type];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`border-transparent gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
