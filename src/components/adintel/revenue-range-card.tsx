import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { InfoTooltip } from "@/components/adintel/info-tooltip";
import { formatCurrency } from "@/lib/utils";

export function RevenueRangeCard({
  label,
  low,
  high,
  currency = "EUR",
  confidence,
  methodology,
}: {
  label: string;
  low: number;
  high: number;
  currency?: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  methodology: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {label}
            <InfoTooltip methodology={methodology} />
          </p>
          <ConfidenceBadge level={confidence} />
        </div>
        <p className="text-2xl font-semibold tracking-tight">
          {formatCurrency(low, currency)}
          <span className="text-muted-foreground">–</span>
          {formatCurrency(high, currency)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Estimated, not verified. See methodology.</p>
      </CardContent>
    </Card>
  );
}
