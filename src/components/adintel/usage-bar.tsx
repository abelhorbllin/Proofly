import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const unlimited = !Number.isFinite(limit);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const nearLimit = !unlimited && pct >= 80;

  return (
    <Link href="/settings/billing" className="block rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-primary/40">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", nearLimit ? "text-warning" : "text-foreground")}>
          {used} / {unlimited ? "∞" : limit}
        </span>
      </div>
      {!unlimited && <Progress value={pct} className="h-1.5" indicatorClassName={nearLimit ? "bg-warning" : undefined} />}
    </Link>
  );
}
