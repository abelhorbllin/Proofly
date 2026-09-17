import { cn } from "@/lib/utils";

const LEVEL_CONFIG = {
  WEAK: { label: "Weak", dot: "bg-danger", text: "text-danger" },
  LOW: { label: "Weak", dot: "bg-danger", text: "text-danger" },
  MEDIUM: { label: "Medium", dot: "bg-warning", text: "text-warning" },
  STRONG: { label: "Strong", dot: "bg-success", text: "text-success" },
  HIGH: { label: "Strong", dot: "bg-success", text: "text-success" },
} as const;

export function SignalCard({
  label,
  value,
  explanation,
}: {
  label: string;
  value: keyof typeof LEVEL_CONFIG;
  explanation?: string;
}) {
  const config = LEVEL_CONFIG[value];
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex items-center gap-1.5 text-xs font-semibold", config.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
          {config.label.toUpperCase()}
        </span>
      </div>
      {explanation && <p className="text-xs leading-relaxed text-muted-foreground">{explanation}</p>}
    </div>
  );
}
