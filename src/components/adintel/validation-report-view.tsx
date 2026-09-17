import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalCard } from "@/components/adintel/signal-card";
import { ConfidenceBadge } from "@/components/adintel/confidence-badge";
import { RevenueRangeCard } from "@/components/adintel/revenue-range-card";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import type { ValidationReport } from "@/lib/validation/types";
import { AlertTriangle, HelpCircle, Lightbulb, Sparkles } from "lucide-react";

export function ValidationReportView({ report }: { report: ValidationReport }) {
  const { unitEconomics } = report;

  return (
    <div className="space-y-8">
      {/* Validation Summary */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> Validation summary
          </CardTitle>
          <CardDescription>AI-interpreted assessment based only on the evidence gathered below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start justify-between gap-4">
            <p className="text-sm leading-relaxed">{report.aiAssessment.summary}</p>
            <ConfidenceBadge level={report.aiAssessment.confidence} className="shrink-0" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.aiAssessment.signals.map((s) => (
              <SignalCard key={s.label} label={s.label} value={s.value} explanation={s.explanation} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A. Market signals */}
      <Section title="A. Market signals">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.marketSignals.map((s) => (
            <SignalCard key={s.label} label={s.label} value={s.value} explanation={s.explanation} />
          ))}
        </div>
      </Section>

      {/* B. Competitor activity */}
      <Section title="B. Competitor activity">
        {report.competitorActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracked competitors currently sell a similarly named product.</p>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {report.competitorActivity.map((c) => (
                <div key={c.storeId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.domain}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{c.activeAds}/{c.totalAds} active ads</span>
                    <span>{c.platforms.join(", ") || "No platform data"}</span>
                    {c.price !== null && <Badge variant="secondary">{formatCurrency(c.price, c.currency)}</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </Section>

      {/* C. Ad signals */}
      <Section title="C. Ad signals">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Total ads" value={report.adSignals.totalAds} />
          <StatBlock label="Active ads" value={report.adSignals.activeAds} />
          <StatBlock label="Distinct angles" value={report.adSignals.angles.length} />
          <StatBlock label="Distinct offers" value={report.adSignals.offers.length} />
        </div>
        {report.adSignals.angles.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {report.adSignals.angles.map((a) => (
              <Badge key={a} variant="outline">{a.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        )}
      </Section>

      {/* D. Business estimates */}
      <Section title="D. Business estimates">
        {report.businessEstimates ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <RevenueRangeCard
              label="Estimated monthly revenue (competitor stores)"
              low={report.businessEstimates.revenueLow}
              high={report.businessEstimates.revenueHigh}
              currency={report.businessEstimates.currency}
              confidence={report.businessEstimates.confidence}
              methodology="Aggregated from the monthly revenue estimates of tracked competitor stores selling this product."
            />
            <Card>
              <CardContent className="p-5">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Estimated monthly traffic</p>
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCompactNumber(report.businessEstimates.trafficLow)}–{formatCompactNumber(report.businessEstimates.trafficHigh)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Insufficient public data to estimate business scale for this product.</p>
        )}
      </Section>

      {/* E. Unit economics */}
      <Section title="E. Unit economics">
        {unitEconomics ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock label="Gross profit / order" value={formatCurrency(unitEconomics.grossProfitPerOrder)} />
            <StatBlock label="Gross margin" value={`${unitEconomics.grossMarginPct}%`} />
            <StatBlock label="Break-even CAC" value={formatCurrency(unitEconomics.breakEvenCAC)} />
            <StatBlock label="Break-even ROAS" value={Number.isFinite(unitEconomics.breakEvenROAS) ? `${unitEconomics.breakEvenROAS}x` : "N/A"} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Add a product cost to calculate unit economics.</p>
        )}
      </Section>

      {/* F. AI assessment detail */}
      <Section title="F. AI assessment">
        <div className="grid gap-6 sm:grid-cols-3">
          <ListBlock icon={AlertTriangle} tone="warning" title="Risks to investigate" items={report.aiAssessment.risks} />
          <ListBlock icon={HelpCircle} tone="info" title="Questions before testing" items={report.aiAssessment.questionsToInvestigate} />
          <ListBlock icon={Lightbulb} tone="success" title="Opportunities" items={report.aiAssessment.opportunities} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ListBlock({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: typeof AlertTriangle;
  tone: "warning" | "info" | "success";
  title: string;
  items: string[];
}) {
  const color = { warning: "text-warning", info: "text-info", success: "text-success" }[tone];
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${color}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted-foreground">{item}</li>
        ))}
      </ul>
    </div>
  );
}
